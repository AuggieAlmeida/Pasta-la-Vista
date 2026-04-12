import { Router } from 'express';
import { stockController } from '../modules/stock/stock.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { validateMiddleware } from '../middleware/validate.middleware';
import { UpdateStockSchema } from '../modules/stock/stock.schema';

const stockRouter = Router();

// Todas as rotas de estoque são admin-only
stockRouter.use(authMiddleware, roleMiddleware(['ADMIN']));

// GET /api/v1/admin/estoque/alertas — ANTES de /:id para não conflitar
stockRouter.get(
  '/alertas',
  (req, res, next) => stockController.getAlerts(req, res, next)
);

// GET /api/v1/admin/estoque
stockRouter.get(
  '/',
  (req, res, next) => stockController.getAll(req, res, next)
);

// PATCH /api/v1/admin/estoque/:id
stockRouter.patch(
  '/:id',
  validateMiddleware(UpdateStockSchema),
  (req, res, next) => stockController.update(req, res, next)
);

export default stockRouter;
