import { Product, IProduct } from './product.model';
import { redis } from '../../config/database';
import { CreateProductInput, UpdateProductInput } from './product.schema';
import { NotFoundError } from '../../utils/errors';

const MENU_CACHE_TTL = 300;
const PRODUCT_CACHE_TTL = 600;

export const productService = {
  async getMenu(): Promise<IProduct[]> {
    try {
      if (redis) {
        const cached = await redis.get('menu:all');
        if (cached) {
          return JSON.parse(cached) as IProduct[];
        }
      }

      const products = await Product.find({ active: true })
        .sort({ category: 1, name: 1 })
        .lean<IProduct[]>();

      if (redis) {
        await redis.setex('menu:all', MENU_CACHE_TTL, JSON.stringify(products));
      }

      return products;
    } catch (error) {
      throw error;
    }
  },

  async getProductById(id: string): Promise<IProduct> {
    try {
      if (redis) {
        const cached = await redis.get(`menu:product:${id}`);
        if (cached) {
          return JSON.parse(cached) as IProduct;
        }
      }

      const product = await Product.findById(id).lean<IProduct>();

      if (!product) {
        throw new NotFoundError('Produto nao encontrado');
      }

      if (redis) {
        await redis.setex(`menu:product:${id}`, PRODUCT_CACHE_TTL, JSON.stringify(product));
      }

      return product;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if ((error as Error).name === 'CastError') {
        throw new NotFoundError('Produto nao encontrado');
      }
      throw error;
    }
  },

  async getByCategory(category: string): Promise<IProduct[]> {
    try {
      if (redis) {
        const cached = await redis.get(`menu:category:${category}`);
        if (cached) {
          return JSON.parse(cached) as IProduct[];
        }
      }

      const products = await Product.find({ category, active: true })
        .sort({ name: 1 })
        .lean<IProduct[]>();

      if (redis) {
        await redis.setex(`menu:category:${category}`, MENU_CACHE_TTL, JSON.stringify(products));
      }

      return products;
    } catch (error) {
      throw error;
    }
  },

  async searchByName(query: string): Promise<IProduct[]> {
    try {
      const products = await Product.find({
        active: true,
        name: { $regex: query, $options: 'i' },
      })
        .sort({ name: 1 })
        .limit(20)
        .lean<IProduct[]>();

      return products;
    } catch (error) {
      throw error;
    }
  },

  async getProductsByIds(ids: string[]): Promise<IProduct[]> {
    try {
      const products = await Product.find({
        _id: { $in: ids },
        active: true,
      }).lean<IProduct[]>();

      return products;
    } catch (error) {
      throw error;
    }
  },

  async createProduct(data: CreateProductInput): Promise<IProduct> {
    try {
      const product = await Product.create(data);
      await this.invalidateCache();
      return product.toObject() as IProduct;
    } catch (error) {
      throw error;
    }
  },

  async updateProduct(id: string, data: UpdateProductInput): Promise<IProduct> {
    try {
      const product = await Product.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      ).lean<IProduct>();

      if (!product) {
        throw new NotFoundError('Produto nao encontrado');
      }

      await this.invalidateCache();
      return product;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if ((error as Error).name === 'CastError') {
        throw new NotFoundError('Produto nao encontrado');
      }
      throw error;
    }
  },

  async deleteProduct(id: string): Promise<IProduct> {
    try {
      const product = await Product.findByIdAndUpdate(
        id,
        { $set: { active: false } },
        { new: true }
      ).lean<IProduct>();

      if (!product) {
        throw new NotFoundError('Produto nao encontrado');
      }

      await this.invalidateCache();
      return product;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if ((error as Error).name === 'CastError') {
        throw new NotFoundError('Produto nao encontrado');
      }
      throw error;
    }
  },

  async invalidateCache(): Promise<void> {
    try {
      if (!redis) return;

      const keys = await redis.keys('menu:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Erro ao invalidar cache:', error);
    }
  },
};
