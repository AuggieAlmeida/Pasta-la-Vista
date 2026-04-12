import { Response, NextFunction } from 'express';
import { orderService } from './order.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export const orderController = {
  async createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Usuario nao autenticado',
        });
        return;
      }

      const order = await orderService.createOrder(userId, req.body);

      res.status(201).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async getOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Usuario nao autenticado',
        });
        return;
      }

      const order = await orderService.getOrderById(id, userId);

      res.status(200).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async addReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { rating, comment } = req.body;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Usuario nao autenticado',
        });
        return;
      }

      if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        res.status(400).json({
          status: 'error',
          message: 'Nota precisa ser um numero entre 1 e 5',
        });
        return;
      }

      const order = await orderService.addOrderReview(id, userId, rating, comment);

      res.status(200).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async listOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Usuario nao autenticado',
        });
        return;
      }

      const orders = await orderService.listUserOrders(userId);

      res.status(200).json({
        status: 'success',
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/pedidos
   * Lista todos os pedidos (Admin).
   */
  async listAllOrders(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await orderService.listAllOrders();

      res.status(200).json({
        status: 'success',
        data: orders,
        count: orders.length,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/admin/pedidos/:id
   * Atualiza o status de um pedido (Admin).
   */
  async updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminId = req.user!.id;

      const order = await orderService.updateOrderStatus(id, status, adminId);

      res.status(200).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/dashboard/metricas
   * Retorna métricas do dashboard (Admin).
   */
  async getDashboardMetrics(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await orderService.getDashboardMetrics();

      res.status(200).json({
        status: 'success',
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/feedbacks
   * Retorna os feedbacks e avaliações dos pedidos entregues (Admin).
   */
  async getFeedbacks(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const feedbacks = await orderService.getFeedbacks();

      res.status(200).json({
        status: 'success',
        data: feedbacks,
        count: feedbacks.length,
      });
    } catch (error) {
      next(error);
    }
  },
};
