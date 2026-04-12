import { Response, NextFunction } from 'express';
import { profileService } from './profile.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export const profileController = {
  // Endereços
  async listAddresses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const addresses = await profileService.listAddresses(userId);
      res.status(200).json({ status: 'success', data: addresses });
    } catch (error) {
      next(error);
    }
  },

  async addAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const address = await profileService.addAddress(userId, req.body);
      res.status(201).json({ status: 'success', data: address });
    } catch (error) {
      next(error);
    }
  },

  async deleteAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await profileService.deleteAddress(id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  // Cartões
  async listCards(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const cards = await profileService.listCards(userId);
      res.status(200).json({ status: 'success', data: cards });
    } catch (error) {
      next(error);
    }
  },

  async addCard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const card = await profileService.addCard(userId, req.body);
      res.status(201).json({ status: 'success', data: card });
    } catch (error) {
      next(error);
    }
  },

  async deleteCard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await profileService.deleteCard(id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
