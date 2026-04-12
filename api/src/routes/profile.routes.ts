import { Router } from 'express';
import { profileController } from '../modules/profile/profile.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const profileRouter = Router();

profileRouter.use(authMiddleware);

// Endereços
profileRouter.get('/addresses', (req, res, next) => profileController.listAddresses(req, res, next));
profileRouter.post('/addresses', (req, res, next) => profileController.addAddress(req, res, next));
profileRouter.delete('/addresses/:id', (req, res, next) => profileController.deleteAddress(req, res, next));

// Cartões
profileRouter.get('/cards', (req, res, next) => profileController.listCards(req, res, next));
profileRouter.post('/cards', (req, res, next) => profileController.addCard(req, res, next));
profileRouter.delete('/cards/:id', (req, res, next) => profileController.deleteCard(req, res, next));

export default profileRouter;
