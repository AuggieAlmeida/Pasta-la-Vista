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
};
