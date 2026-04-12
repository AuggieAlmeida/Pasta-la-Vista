import { Router } from 'express';
import { favoriteController } from '../modules/favorites/favorite.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const favoriteRouter = Router();

favoriteRouter.use(authMiddleware);

favoriteRouter.get('/', (req, res, next) => favoriteController.getFavorites(req, res, next));
favoriteRouter.post('/', (req, res, next) => favoriteController.addFavorite(req, res, next));
favoriteRouter.delete('/:productId', (req, res, next) => favoriteController.removeFavorite(req, res, next));

export default favoriteRouter;
