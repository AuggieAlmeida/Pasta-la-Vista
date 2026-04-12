import { Router } from 'express';
import { orderController } from '../modules/orders/order.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { upload, handleUploadError } from '../middleware/upload.middleware';
import { uploadProductImage } from '../utils/r2';
import { Product } from '../modules/products/product.model';
import { productService } from '../modules/products/product.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';

const adminRouter = Router();

// Todas as rotas admin requerem autenticação + role ADMIN
adminRouter.use(authMiddleware, roleMiddleware(['ADMIN']));

// ──── Pedidos Admin ────────────────────────────────────
adminRouter.get(
  '/pedidos',
  (req, res, next) => orderController.listAllOrders(req, res, next)
);

adminRouter.patch(
  '/pedidos/:id',
  (req, res, next) => orderController.updateOrderStatus(req, res, next)
);

// ──── Dashboard Métricas ───────────────────────────────
adminRouter.get(
  '/dashboard/metricas',
  (req, res, next) => orderController.getDashboardMetrics(req, res, next)
);

// ──── Feedbacks / Avaliações ───────────────────────────
adminRouter.get(
  '/feedbacks',
  (req, res, next) => orderController.getFeedbacks(req, res, next)
);


// ──── Upload de Imagem de Produto ──────────────────────
adminRouter.post(
  '/produtos/:id/imagem',
  upload.single('image'),
  handleUploadError,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          status: 'error',
          message: 'Nenhuma imagem enviada. Use campo "image" no multipart form.',
        });
        return;
      }

      // Upload para R2
      const imageUrl = await uploadProductImage(file.buffer, id);

      // Atualizar URL no MongoDB
      const product = await Product.findByIdAndUpdate(
        id,
        { $set: { image: imageUrl } },
        { new: true }
      ).lean();

      if (!product) {
        res.status(404).json({
          status: 'error',
          message: 'Produto não encontrado',
        });
        return;
      }

      // Invalidar cache do menu
      await productService.invalidateCache();

      res.status(200).json({
        status: 'success',
        data: {
          imageUrl,
          productId: id,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default adminRouter;
