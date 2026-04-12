import { Router } from 'express';
import { orderController } from '../modules/orders/order.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateMiddleware } from '../middleware/validate.middleware';
import { CreateOrderSchema } from '../modules/orders/order.schema';

const orderRouter = Router();

// Todas rotas de orders requerem autenticacao
orderRouter.post(
  '/',
  authMiddleware,
  validateMiddleware(CreateOrderSchema),
  (req, res, next) => orderController.createOrder(req, res, next)
);

orderRouter.get(
  '/',
  authMiddleware,
  (req, res, next) => orderController.listOrders(req, res, next)
);

orderRouter.get(
  '/:id',
  authMiddleware,
  (req, res, next) => orderController.getOrder(req, res, next)
);

orderRouter.post(
  '/:id/avaliacao',
  authMiddleware,
  (req, res, next) => orderController.addReview(req, res, next)
);

export default orderRouter;
