import { Router } from 'express';
import { productController } from '../modules/products/product.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { validateMiddleware } from '../middleware/validate.middleware';
import { CreateProductSchema, UpdateProductSchema } from '../modules/products/product.schema';

const menuRouter = Router();

// Rotas publicas
menuRouter.get(
  '/',
  (req, res, next) => productController.getMenu(req, res, next)
);

menuRouter.get(
  '/search',
  (req, res, next) => productController.searchProducts(req, res, next)
);

menuRouter.get(
  '/category/:category',
  (req, res, next) => productController.getByCategory(req, res, next)
);

menuRouter.get(
  '/:id',
  (req, res, next) => productController.getProductById(req, res, next)
);

// Rotas admin
menuRouter.post(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  validateMiddleware(CreateProductSchema),
  (req, res, next) => productController.createProduct(req, res, next)
);

menuRouter.patch(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  validateMiddleware(UpdateProductSchema),
  (req, res, next) => productController.updateProduct(req, res, next)
);

menuRouter.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  (req, res, next) => productController.deleteProduct(req, res, next)
);

export default menuRouter;
