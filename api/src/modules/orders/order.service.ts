import { prisma } from '../../config/database';
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
  address: CreateOrderInput['address'];
  notes: string;
  payment_method: string;
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

      // 4. Calcular precos no servidor (nunca confiar no cliente)
      const orderItems: IOrderItemDoc[] = [];
      let subtotal = 0;

      for (const item of dto.items) {
        const product = productMap.get(item.product_id);
        if (!product) continue;

        let itemUnitPrice = product.price;
        const customizationDetails: IOrderItemDoc['customizations'] = [];

        // Processar customizacoes
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

      const total = subtotal + DELIVERY_FEE;

      // 5. Criar Order no PostgreSQL (Prisma)
      const order = await prisma.order.create({
        data: {
          userId,
          total: new Decimal(total.toFixed(2)),
          status: 'PENDING',
          paymentMethod: dto.payment_method,
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
        delivery_fee: DELIVERY_FEE,
        discount: 0,
        total,
        status: 'PENDING',
        address: dto.address,
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
        delivery_fee: DELIVERY_FEE,
        discount: 0,
        total,
        status: order.status,
        address: dto.address,
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
          address: orderLog.address,
          notes: orderLog.notes,
          payment_method: orderLog.payment_method,
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
          address: log
            ? log.address
            : { street: '', number: '', city: '', state: '', zip: '' },
          notes: log ? log.notes : '',
          payment_method: order.paymentMethod,
          createdAt: order.createdAt,
        };
      });
    } catch (error) {
      throw error;
    }
  },
};
