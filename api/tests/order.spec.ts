import { orderService } from '../src/modules/orders/order.service';
import { productService } from '../src/modules/products/product.service';
import { OrderLog } from '../src/modules/orders/order.model';
import { prisma } from '../src/config/database';

// Mock dependencies
jest.mock('../src/modules/products/product.service');
jest.mock('../src/modules/orders/order.model');
jest.mock('../src/config/database', () => ({
  prisma: {
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    stock: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
  },
}));

const mockProduct = {
  _id: { toString: () => '507f1f77bcf86cd799439011' },
  name: 'Pizza Margherita',
  price: 42.90,
  active: true,
  customizations: [
    {
      _id: { toString: () => 'cust1' },
      type: 'size',
      name: 'Media',
      price_modifier: 10,
      available: true,
    },
  ],
};

const mockCreateOrderDto = {
  items: [
    {
      product_id: '507f1f77bcf86cd799439011',
      quantity: 2,
      customizations: [
        {
          customization_id: 'cust1',
          price_modifier: 10,
        },
      ],
    },
  ],
  address: {
    street: 'Rua das Flores',
    number: '42',
    city: 'Sao Paulo',
    state: 'SP',
    zip: '01234-567',
  },
  notes: 'Sem cebola',
  payment_method: 'PIX' as const,
};

const userId = 'user-123-uuid';

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('deve criar pedido com items validos', async () => {
      // Setup mocks
      (productService.getProductsByIds as jest.Mock).mockResolvedValue([mockProduct]);

      (prisma.stock.findUnique as jest.Mock).mockResolvedValue({
        productId: '507f1f77bcf86cd799439011',
        quantity: 50,
        minQuantity: 5,
        status: 'AVAILABLE',
      });

      const expectedTotal = (42.90 + 10) * 2 + 5; // (price + customize) * qty + delivery
      const mockOrder = {
        id: 'order-uuid-1',
        userId,
        total: expectedTotal,
        status: 'PENDING',
        paymentMethod: 'PIX',
        createdAt: new Date(),
        items: [
          {
            id: 'item-1',
            productId: '507f1f77bcf86cd799439011',
            quantity: 2,
            unitPrice: 52.90,
            obs: null,
          },
        ],
      };

      (prisma.order.create as jest.Mock).mockResolvedValue(mockOrder);
      (OrderLog.create as jest.Mock).mockResolvedValue({});
      (prisma.stock.update as jest.Mock).mockResolvedValue({});

      const result = await orderService.createOrder(userId, mockCreateOrderDto);

      expect(result.id).toBe('order-uuid-1');
      expect(result.status).toBe('PENDING');
      expect(result.total).toBeCloseTo(expectedTotal, 1);
      expect(prisma.order.create).toHaveBeenCalled();
      expect(OrderLog.create).toHaveBeenCalled();
    });

    it('deve rejeitar se estoque insuficiente (422)', async () => {
      (productService.getProductsByIds as jest.Mock).mockResolvedValue([mockProduct]);

      (prisma.stock.findUnique as jest.Mock).mockResolvedValue({
        productId: '507f1f77bcf86cd799439011',
        quantity: 1,
        minQuantity: 5,
        status: 'LOW',
      });

      await expect(
        orderService.createOrder(userId, mockCreateOrderDto)
      ).rejects.toThrow(/Estoque insuficiente/);
    });

    it('deve calcular total corretamente', async () => {
      (productService.getProductsByIds as jest.Mock).mockResolvedValue([mockProduct]);

      (prisma.stock.findUnique as jest.Mock).mockResolvedValue({
        productId: '507f1f77bcf86cd799439011',
        quantity: 50,
        minQuantity: 5,
        status: 'AVAILABLE',
      });

      const mockOrder = {
        id: 'order-uuid-2',
        userId,
        total: 110.80,
        status: 'PENDING',
        paymentMethod: 'PIX',
        createdAt: new Date(),
        items: [],
      };

      (prisma.order.create as jest.Mock).mockResolvedValue(mockOrder);
      (OrderLog.create as jest.Mock).mockResolvedValue({});
      (prisma.stock.update as jest.Mock).mockResolvedValue({});

      const result = await orderService.createOrder(userId, mockCreateOrderDto);

      // Unit price = 42.90 + 10 (size customize) = 52.90
      // Subtotal = 52.90 * 2 = 105.80
      // Total = 105.80 + 5.00 (delivery) = 110.80
      expect(result.subtotal).toBeCloseTo(105.80, 1);
      expect(result.delivery_fee).toBe(5.0);
      expect(result.total).toBeCloseTo(110.80, 1);
    });

    it('deve retornar 422 se product_id invalido', async () => {
      (productService.getProductsByIds as jest.Mock).mockResolvedValue([]);

      await expect(
        orderService.createOrder(userId, mockCreateOrderDto)
      ).rejects.toThrow(/nao encontrado ou indisponivel/);
    });
  });

  describe('getOrderById', () => {
    it('deve verificar que user so ve seus proprios orders', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order-1',
        userId: 'other-user',
        status: 'PENDING',
        total: 100,
        paymentMethod: 'PIX',
        createdAt: new Date(),
        items: [],
      });

      await expect(
        orderService.getOrderById('order-1', userId)
      ).rejects.toThrow('Pedido nao encontrado');
    });

    it('deve retornar pedido quando user e o dono', async () => {
      const mockOrder = {
        id: 'order-1',
        userId,
        status: 'PENDING',
        total: 100,
        paymentMethod: 'PIX',
        createdAt: new Date(),
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            quantity: 1,
            unitPrice: 95,
            obs: null,
          },
        ],
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const mockOrderLog = {
        order_id: 'order-1',
        user_id: userId,
        items: [
          {
            product_id: 'prod-1',
            product_name: 'Pizza Margherita',
            quantity: 1,
            unit_price: 95,
            customizations: [],
            subtotal: 95,
          },
        ],
        subtotal: 95,
        delivery_fee: 5,
        discount: 0,
        total: 100,
        status: 'PENDING',
        address: {
          street: 'Rua A',
          number: '1',
          city: 'SP',
          state: 'SP',
          zip: '01000-000',
        },
        notes: '',
        payment_method: 'PIX',
      };

      (OrderLog.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockOrderLog),
      });

      const result = await orderService.getOrderById('order-1', userId);

      expect(result.id).toBe('order-1');
      expect(result.userId).toBe(userId);
    });
  });
});
