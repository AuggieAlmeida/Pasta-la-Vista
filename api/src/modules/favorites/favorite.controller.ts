import { Response, NextFunction } from 'express';
import { favoriteService } from './favorite.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export const favoriteController = {
  async addFavorite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { productId } = req.body;

      if (!productId) {
        res.status(400).json({ status: 'error', message: 'productId é obrigatório' });
        return;
      }

      await favoriteService.addFavorite(userId, productId);
      res.status(201).json({ status: 'success', message: 'Adicionado aos favoritos' });
    } catch (error) {
      next(error);
    }
  },

  async removeFavorite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { productId } = req.params;

      await favoriteService.removeFavorite(userId, productId);
      res.status(200).json({ status: 'success', message: 'Removido dos favoritos' });
    } catch (error) {
      next(error);
    }
  },

  async getFavorites(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const favorites = await favoriteService.getFavorites(userId);
      res.status(200).json({ status: 'success', data: favorites });
    } catch (error) {
      next(error);
    }
  }
};
