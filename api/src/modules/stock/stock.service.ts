import { prisma } from '../../config/database';
import { redis } from '../../config/database';
import { Product } from '../products/product.model';
import { NotFoundError } from '../../utils/errors';
import { UpdateStockInput } from './stock.schema';

const STOCK_ALERTS_CACHE_TTL = 60; // 1 minuto

interface StockWithProduct {
  id: string;
  productId: string;
  productName: string;
  productCategory: string;
  productImage: string;
  quantity: number;
  minQuantity: number;
  status: string;
}

/**
 * Calcula o status do estoque baseado na quantidade e limite mínimo
 */
function calculateStockStatus(
  quantity: number,
  minQuantity: number
): 'AVAILABLE' | 'LOW' | 'OUT_OF_STOCK' {
  if (quantity <= 0) return 'OUT_OF_STOCK';
  if (quantity <= minQuantity) return 'LOW';
  return 'AVAILABLE';
}

export const stockService = {
  /**
   * Lista todos os itens de estoque com dados do produto (MongoDB)
   */
  async getAllStock(): Promise<StockWithProduct[]> {
    const stocks = await prisma.stock.findMany({
      orderBy: [{ status: 'asc' }, { quantity: 'asc' }],
    });

    // Buscar dados dos produtos no MongoDB
    const productIds = stocks.map((s) => s.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name category image')
      .lean();

    const productMap = new Map(
      products.map((p: any) => [p._id.toString(), p])
    );

    return stocks.map((stock) => {
      const product = productMap.get(stock.productId);
      return {
        id: stock.id,
        productId: stock.productId,
        productName: product?.name || 'Produto desconhecido',
        productCategory: product?.category || '',
        productImage: product?.image || '',
        quantity: stock.quantity,
        minQuantity: stock.minQuantity,
        status: stock.status,
      };
    });
  },

  /**
   * Atualiza a quantidade de um item de estoque e recalcula o status.
   */
  async updateStock(stockId: string, data: UpdateStockInput): Promise<StockWithProduct> {
    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
    });

    if (!stock) {
      throw new NotFoundError('Item de estoque não encontrado');
    }

    const newQuantity = data.quantity;
    const newMinQuantity = data.minQuantity ?? stock.minQuantity;
    const newStatus = calculateStockStatus(newQuantity, newMinQuantity);

    const updated = await prisma.stock.update({
      where: { id: stockId },
      data: {
        quantity: newQuantity,
        minQuantity: newMinQuantity,
        status: newStatus,
      },
    });

    // Invalidar cache de alertas
    await this.invalidateAlertsCache();

    // Buscar dados do produto no MongoDB
    const product = await Product.findById(updated.productId)
      .select('name category image')
      .lean() as any;

    return {
      id: updated.id,
      productId: updated.productId,
      productName: product?.name || 'Produto desconhecido',
      productCategory: product?.category || '',
      productImage: product?.image || '',
      quantity: updated.quantity,
      minQuantity: updated.minQuantity,
      status: updated.status,
    };
  },

  /**
   * Retorna apenas itens com status LOW ou OUT_OF_STOCK
   */
  async getAlerts(): Promise<StockWithProduct[]> {
    // Tentar cache Redis
    if (redis) {
      const cached = await redis.get('stock:alerts');
      if (cached) {
        return JSON.parse(cached) as StockWithProduct[];
      }
    }

    const stocks = await prisma.stock.findMany({
      where: {
        status: {
          in: ['LOW', 'OUT_OF_STOCK'],
        },
      },
      orderBy: [{ status: 'asc' }, { quantity: 'asc' }],
    });

    // Buscar dados dos produtos
    const productIds = stocks.map((s) => s.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name category image')
      .lean();

    const productMap = new Map(
      products.map((p: any) => [p._id.toString(), p])
    );

    const alerts: StockWithProduct[] = stocks.map((stock) => {
      const product = productMap.get(stock.productId);
      return {
        id: stock.id,
        productId: stock.productId,
        productName: product?.name || 'Produto desconhecido',
        productCategory: product?.category || '',
        productImage: product?.image || '',
        quantity: stock.quantity,
        minQuantity: stock.minQuantity,
        status: stock.status,
      };
    });

    // Salvar no cache
    if (redis) {
      await redis.setex('stock:alerts', STOCK_ALERTS_CACHE_TTL, JSON.stringify(alerts));
    }

    return alerts;
  },

  /**
   * Retorna a contagem de alertas (para dashboard KPI)
   */
  async getAlertsCount(): Promise<number> {
    return prisma.stock.count({
      where: {
        status: {
          in: ['LOW', 'OUT_OF_STOCK'],
        },
      },
    });
  },

  /**
   * Invalida o cache de alertas no Redis
   */
  async invalidateAlertsCache(): Promise<void> {
    try {
      if (redis) {
        await redis.del('stock:alerts');
      }
    } catch (error) {
      console.error('Erro ao invalidar cache de alertas:', error);
    }
  },
};
