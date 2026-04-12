import { prisma, redis } from '../../config/database';
import { productService } from '../products/product.service';
import { OrderLog, IOrderItemDoc } from './order.model';
import { CreateOrderInput } from './order.schema';
import { NotFoundError, ValidationError, AppError } from '../../utils/errors';
import { Decimal } from '@prisma/client/runtime/library';

const DELIVERY_FEE = 5.0;

interface OrderResult {
  id: string;
  userId: string;
  items: IOrderItemDoc[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  status: string;
  delivery_mode: string;
  table_number?: string;
  coupon_code?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zip: string;
  };
  notes: string;
  payment_method: string;
  review?: {
    rating: number;
    comment: string;
    created_at: Date;
  };
  createdAt: Date;
}

export const orderService = {
  async createOrder(userId: string, dto: CreateOrderInput): Promise<OrderResult> {
    try {
      // 1. Buscar todos os produtos referenciados
      const productIds = dto.items.map((item) => item.product_id);
      const products = await productService.getProductsByIds(productIds);

      // 2. Validar que todos os produtos existem
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      for (const item of dto.items) {
        if (!productMap.has(item.product_id)) {
          throw new AppError(
            `Produto ${item.product_id} nao encontrado ou indisponivel`,
            422
          );
        }
      }

      // 3. Verificar estoque para cada item
      for (const item of dto.items) {
        const stock = await prisma.stock.findUnique({
          where: { productId: item.product_id },
        });

        if (stock) {
          if (stock.status === 'OUT_OF_STOCK') {
            const product = productMap.get(item.product_id);
            throw new AppError(
              `Produto "${product?.name}" esta fora de estoque`,
              422
            );
          }
          if (stock.quantity < item.quantity) {
            const product = productMap.get(item.product_id);
            throw new AppError(
              `Estoque insuficiente para "${product?.name}". Disponivel: ${stock.quantity}`,
              422
            );
          }
        }
      }

      // 4. Calcular precos e aplicar cupons
      let subtotal = 0;
      const orderItems: IOrderItemDoc[] = [];

      for (const item of dto.items) {
        const product = productMap.get(item.product_id);
        if (!product) continue;

        let itemUnitPrice = product.price;
        const customizationDetails: IOrderItemDoc['customizations'] = [];

        if (item.customizations && item.customizations.length > 0) {
          for (const cust of item.customizations) {
            const productCustomization = product.customizations?.find(
              (c) => c._id?.toString() === cust.customization_id
            );
            if (productCustomization) {
              itemUnitPrice += productCustomization.price_modifier;
              customizationDetails.push({
                customization_id: cust.customization_id,
                name: productCustomization.name,
                price_modifier: productCustomization.price_modifier,
              });
            }
          }
        }

        const itemSubtotal = itemUnitPrice * item.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
          product_id: item.product_id,
          product_name: product.name,
          quantity: item.quantity,
          unit_price: itemUnitPrice,
          customizations: customizationDetails,
          subtotal: itemSubtotal,
        });
      }

      // Entrega dinamica e Cupom
      let applicableDeliveryFee = dto.delivery_mode === 'DELIVERY' ? DELIVERY_FEE : 0;
      let finalDiscount = 0;
      let usedCouponId: string | undefined;

      if (dto.coupon_code) {
        const coupon = await prisma.coupon.findUnique({
          where: { code: dto.coupon_code.toUpperCase() }
        });

        if (coupon && coupon.active && (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit)) {
          if (coupon.discountType === 'PERCENTAGE') {
            finalDiscount = subtotal * (Number(coupon.discountValue) / 100);
          } else {
            finalDiscount = Number(coupon.discountValue);
          }
          usedCouponId = coupon.id;
          
          // Incrementar uso (poderia ser feito dentro de transaction se estrito)
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: coupon.usedCount + 1 }
          });
        }
      }

      // Nao deixar o desconto ser maior que o subtotal
      if (finalDiscount > subtotal) {
        finalDiscount = subtotal;
      }

      const total = subtotal + applicableDeliveryFee - finalDiscount;

      // Pegar os dados de endereco salvos caso pertinente
      let userAddressDetails = undefined;
      if (dto.delivery_mode === 'DELIVERY' && dto.address_id) {
        const foundAddress = await prisma.userAddress.findFirst({
          where: { id: dto.address_id, userId }
        });
        if (foundAddress) {
          userAddressDetails = {
            street: foundAddress.street,
            number: foundAddress.number,
            complement: foundAddress.complement || '',
            city: foundAddress.city,
            state: foundAddress.state,
            zip: foundAddress.zip,
          };
        }
      }

      // 5. Criar Order no PostgreSQL (Prisma)
      const order = await prisma.order.create({
        data: {
          userId,
          total: new Decimal(total.toFixed(2)),
          status: 'PENDING',
          paymentMethod: dto.payment_method,
          deliveryMode: dto.delivery_mode as any,
          tableNumber: dto.table_number,
          couponId: usedCouponId,
          items: {
            create: orderItems.map((item) => ({
              productId: item.product_id,
              quantity: item.quantity,
              unitPrice: new Decimal(item.unit_price.toFixed(2)),
              obs: dto.items.find((i) => i.product_id === item.product_id)?.obs || null,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 6. Salvar log completo no MongoDB
      await OrderLog.create({
        order_id: order.id,
        user_id: userId,
        items: orderItems,
        subtotal,
        delivery_fee: applicableDeliveryFee,
        discount: finalDiscount,
        total,
        status: 'PENDING',
        delivery_mode: dto.delivery_mode,
        table_number: dto.table_number,
        coupon_code: dto.coupon_code,
        address: userAddressDetails,
        notes: dto.notes || '',
        payment_method: dto.payment_method,
      });

      // 7. Decrementar estoque
      for (const item of dto.items) {
        const stock = await prisma.stock.findUnique({
          where: { productId: item.product_id },
        });

        if (stock) {
          const newQuantity = stock.quantity - item.quantity;
          let newStatus: 'AVAILABLE' | 'LOW' | 'OUT_OF_STOCK' = 'AVAILABLE';
          if (newQuantity <= 0) {
            newStatus = 'OUT_OF_STOCK';
          } else if (newQuantity <= stock.minQuantity) {
            newStatus = 'LOW';
          }

          await prisma.stock.update({
            where: { productId: item.product_id },
            data: {
              quantity: Math.max(newQuantity, 0),
              status: newStatus,
            },
          });
        }
      }

      return {
        id: order.id,
        userId: order.userId,
        items: orderItems,
        subtotal,
        delivery_fee: applicableDeliveryFee,
        discount: finalDiscount,
        total,
        status: order.status,
        delivery_mode: dto.delivery_mode,
        table_number: dto.table_number,
        coupon_code: dto.coupon_code,
        address: userAddressDetails,
        notes: dto.notes || '',
        payment_method: dto.payment_method,
        createdAt: order.createdAt,
      };
    } catch (error) {
      if (error instanceof AppError || error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw error;
    }
  },

  async getOrderById(orderId: string, userId: string): Promise<OrderResult> {
    try {
      // Buscar no PostgreSQL
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundError('Pedido nao encontrado');
      }

      // Security check: user so pode ver seus proprios pedidos
      if (order.userId !== userId) {
        throw new NotFoundError('Pedido nao encontrado');
      }

      // Buscar detalhes completos no MongoDB
      const orderLog = await OrderLog.findOne({ order_id: orderId }).lean();

      if (orderLog) {
        return {
          id: order.id,
          userId: order.userId,
          items: orderLog.items,
          subtotal: orderLog.subtotal,
          delivery_fee: orderLog.delivery_fee,
          discount: orderLog.discount,
          total: orderLog.total,
          status: order.status,
          delivery_mode: orderLog.delivery_mode || order.deliveryMode,
          table_number: orderLog.table_number ?? order.tableNumber ?? undefined,
          coupon_code: orderLog.coupon_code,
          address: orderLog.address,
          notes: orderLog.notes,
          payment_method: orderLog.payment_method,
          review: orderLog.review,
          createdAt: order.createdAt,
        };
      }

      // Fallback se MongoDB nao tiver o log
      return {
        id: order.id,
        userId: order.userId,
        items: order.items.map((item) => ({
          product_id: item.productId,
          product_name: '',
          quantity: item.quantity,
          unit_price: Number(item.unitPrice),
          customizations: [],
          subtotal: Number(item.unitPrice) * item.quantity,
        })),
        subtotal: Number(order.total) - DELIVERY_FEE,
        delivery_fee: DELIVERY_FEE,
        discount: 0,
        total: Number(order.total),
        status: order.status,
        delivery_mode: order.deliveryMode,
        table_number: order.tableNumber ?? undefined,
        address: { street: '', number: '', city: '', state: '', zip: '' },
        notes: '',
        payment_method: order.paymentMethod,
        createdAt: order.createdAt,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw error;
    }
  },

  async listUserOrders(userId: string): Promise<OrderResult[]> {
    try {
      const orders = await prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });

      // Buscar logs do MongoDB para enriquecer dados
      const orderIds = orders.map((o) => o.id);
      const orderLogs = await OrderLog.find({ order_id: { $in: orderIds } }).lean();
      const logMap = new Map(orderLogs.map((log) => [log.order_id, log]));

      return orders.map((order) => {
        const log = logMap.get(order.id);

        return {
          id: order.id,
          userId: order.userId,
          items: log
            ? log.items
            : order.items.map((item) => ({
                product_id: item.productId,
                product_name: '',
                quantity: item.quantity,
                unit_price: Number(item.unitPrice),
                customizations: [],
                subtotal: Number(item.unitPrice) * item.quantity,
              })),
          subtotal: log ? log.subtotal : Number(order.total) - DELIVERY_FEE,
          delivery_fee: DELIVERY_FEE,
          discount: log ? log.discount : 0,
          total: Number(order.total),
          status: order.status,
          delivery_mode: log?.delivery_mode || order.deliveryMode,
          table_number: log?.table_number ?? order.tableNumber ?? undefined,
          coupon_code: log?.coupon_code,
          address: log
            ? log.address
            : { street: '', number: '', city: '', state: '', zip: '' },
          notes: log ? log.notes : '',
          payment_method: order.paymentMethod,
          review: log?.review,
          createdAt: order.createdAt,
        };
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lista todos os pedidos (Admin).
   * Inclui dados do usuário e enriquece com MongoDB.
   */
  async listAllOrders(): Promise<(OrderResult & { userName: string; userEmail: string })[]> {
    try {
      const orders = await prisma.order.findMany({
        include: {
          items: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const orderIds = orders.map((o) => o.id);
      const orderLogs = await OrderLog.find({ order_id: { $in: orderIds } }).lean();
      const logMap = new Map(orderLogs.map((log) => [log.order_id, log]));

      return orders.map((order) => {
        const log = logMap.get(order.id);

        return {
          id: order.id,
          userId: order.userId,
          userName: order.user.name,
          userEmail: order.user.email,
          items: log
            ? log.items
            : order.items.map((item) => ({
                product_id: item.productId,
                product_name: '',
                quantity: item.quantity,
                unit_price: Number(item.unitPrice),
                customizations: [],
                subtotal: Number(item.unitPrice) * item.quantity,
              })),
          subtotal: log ? log.subtotal : Number(order.total) - DELIVERY_FEE,
          delivery_fee: DELIVERY_FEE,
          discount: log ? log.discount : 0,
          total: Number(order.total),
          status: order.status,
          delivery_mode: log?.delivery_mode || order.deliveryMode,
          table_number: log?.table_number ?? order.tableNumber ?? undefined,
          coupon_code: log?.coupon_code,
          address: log
            ? log.address
            : { street: '', number: '', city: '', state: '', zip: '' },
          notes: log ? log.notes : '',
          payment_method: order.paymentMethod,
          review: log?.review,
          createdAt: order.createdAt,
        };
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Atualiza o status de um pedido (Admin).
   * Registra mudança no histórico do MongoDB.
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: string,
    adminId: string
  ): Promise<OrderResult> {
    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(newStatus)) {
      throw new ValidationError(`Status inválido. Valores aceitos: ${validStatuses.join(', ')}`);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundError('Pedido não encontrado');
    }

    // Atualizar no PostgreSQL
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus as any },
      include: { items: true },
    });

    // Atualizar log no MongoDB
    try {
      await OrderLog.findOneAndUpdate(
        { order_id: orderId },
        {
          $set: { status: newStatus },
          $push: {
            status_history: {
              status: newStatus,
              changed_at: new Date(),
              changed_by: adminId,
            },
          },
        }
      );
    } catch (err) {
      console.error('Erro ao atualizar status no MongoDB:', err);
    }

    // Buscar log para retorno enriquecido
    const orderLog = await OrderLog.findOne({ order_id: orderId }).lean();

    return {
      id: updated.id,
      userId: updated.userId,
      items: orderLog
        ? orderLog.items
        : updated.items.map((item) => ({
            product_id: item.productId,
            product_name: '',
            quantity: item.quantity,
            unit_price: Number(item.unitPrice),
            customizations: [],
            subtotal: Number(item.unitPrice) * item.quantity,
          })),
      subtotal: orderLog ? orderLog.subtotal : Number(updated.total) - DELIVERY_FEE,
      delivery_fee: DELIVERY_FEE,
      discount: orderLog ? orderLog.discount : 0,
      total: Number(updated.total),
      status: updated.status,
      delivery_mode: orderLog?.delivery_mode || updated.deliveryMode,
      table_number: orderLog?.table_number ?? updated.tableNumber ?? undefined,
      coupon_code: orderLog?.coupon_code,
      address: orderLog
        ? orderLog.address
        : { street: '', number: '', city: '', state: '', zip: '' },
      notes: orderLog ? orderLog.notes : '',
      payment_method: updated.paymentMethod,
      review: orderLog?.review,
      createdAt: updated.createdAt,
    };
  },

  async addOrderReview(orderId: string, userId: string, rating: number, comment: string): Promise<OrderResult> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) throw new NotFoundError('Pedido nao encontrado');
    if (order.status !== 'DELIVERED') throw new ValidationError('Apenas pedidos entregues podem ser avaliados.');

    const orderLog = await OrderLog.findOne({ order_id: orderId });
    if (!orderLog) throw new NotFoundError('Historico do pedido nao encontrado no MongoDB');

    if (orderLog.review) throw new ValidationError('Este pedido ja foi avaliado anteriormente.');

    orderLog.review = { rating, comment, created_at: new Date() };
    await orderLog.save();

    return this.getOrderById(orderId, userId);
  },

  /**
   * DASHBOARD METRICS
   * Retorna Faturamento, quantidade de pedidos e etc.
   * Utiliza cache do ioredis com TTL de 60 segundos para ultra performance.
   */
  async getDashboardMetrics() {

    if (redis) {
      try {
        const cached = await redis.get('admin:dashboard:metrics');
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        console.warn('Falha ao ler cache do Redis para dashboard (continuando com banco de dados):', err);
      }
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalOrders,
      ordersToday,
      totalRevenue,
      revenueToday,
      ordersByStatus,
      stockAlerts,
      totalProducts,
    ] = await Promise.all([
      // Total de pedidos (todos os tempos)
      prisma.order.count(),
      // Pedidos hoje
      prisma.order.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      // Faturamento total (apenas pedidos confirmados/entregues)
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { in: ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'] },
        },
      }),
      // Faturamento hoje
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { in: ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'] },
          createdAt: { gte: startOfToday },
        },
      }),
      // Contagem por status
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Alertas de estoque
      prisma.stock.count({
        where: { status: { in: ['LOW', 'OUT_OF_STOCK'] } },
      }),
      // Total de produtos no estoque
      prisma.stock.count(),
    ]);

    const result = {
      orders: {
        total: totalOrders,
        today: ordersToday,
        byStatus: ordersByStatus.reduce((acc, curr) => {
          const raw = curr._count as unknown;
          const n =
            typeof raw === 'number'
              ? raw
              : raw && typeof raw === 'object' && '_all' in (raw as object)
                ? Number((raw as { _all: number })._all)
                : 0;
          return { ...acc, [curr.status]: n };
        }, {} as Record<string, number>),
      },
      revenue: {
        total: Number(totalRevenue._sum.total || 0),
        today: Number(revenueToday._sum.total || 0),
        averageTicket: totalOrders > 0
          ? Number(totalRevenue._sum.total || 0) / totalOrders
          : 0,
      },
      stock: {
        totalProducts,
        alerts: stockAlerts,
      },
    };

    if (redis) {
      try {
        // TTL 60 seconds
        await redis.setex('admin:dashboard:metrics', 60, JSON.stringify(result));
      } catch (err) {
        console.warn('Falha ao gravar cache do Redis para dashboard:', err);
      }
    }

    return result;
  },

  /**
   * Lista todos os feedbacks (Admin)
   */
  async getFeedbacks() {
    const orderLogs = await OrderLog.find({ review: { $exists: true } })
      .sort({ 'review.created_at': -1 })
      .lean();

    const orderIds = orderLogs.map((log) => log.order_id);
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: { user: { select: { name: true, email: true } } },
    });
    const orderMap = new Map(orders.map((o) => [o.id, o]));

    return orderLogs.map((log) => {
      const order = orderMap.get(log.order_id);
      return {
        orderId: log.order_id,
        userName: order?.user?.name || 'Cliente',
        userEmail: order?.user?.email || '',
        rating: log.review?.rating,
        comment: log.review?.comment,
        createdAt: log.review?.created_at,
      };
    });
  },
};
