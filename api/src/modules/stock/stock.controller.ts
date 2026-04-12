import { Response, NextFunction } from 'express';
import { stockService } from './stock.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export const stockController = {
  /**
   * GET /api/v1/admin/estoque
   * Lista todos os itens de estoque com dados do produto.
   * Auth: Admin
   */
  async getAll(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stocks = await stockService.getAllStock();

      res.status(200).json({
        status: 'success',
        data: stocks,
        count: stocks.length,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/admin/estoque/:id
   * Atualiza quantidade de um item de estoque.
   * Auth: Admin
   */
  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await stockService.updateStock(id, req.body);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/estoque/alertas
   * Lista itens com status LOW ou OUT_OF_STOCK.
   * Auth: Admin
   */
  async getAlerts(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const alerts = await stockService.getAlerts();

      res.status(200).json({
        status: 'success',
        data: alerts,
        count: alerts.length,
      });
    } catch (error) {
      next(error);
    }
  },
};
