import { Request, Response, NextFunction } from 'express';
import { productService } from './product.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export const productController = {
  async getMenu(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await productService.getMenu();

      res.status(200).json({
        status: 'success',
        data: products,
      });
    } catch (error) {
      next(error);
    }
  },

  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);

      res.status(200).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  },

  async getByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.params;
      const products = await productService.getByCategory(category);

      res.status(200).json({
        status: 'success',
        data: products,
      });
    } catch (error) {
      next(error);
    }
  },

  async searchProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query.q;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        res.status(400).json({
          status: 'error',
          message: 'Query muito curta',
        });
        return;
      }

      const products = await productService.searchByName(q.trim());

      res.status(200).json({
        status: 'success',
        data: products,
      });
    } catch (error) {
      next(error);
    }
  },

  async createProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.createProduct(req.body);

      res.status(201).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const product = await productService.updateProduct(id, req.body);

      res.status(200).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const product = await productService.deleteProduct(id);

      res.status(200).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  },
};
