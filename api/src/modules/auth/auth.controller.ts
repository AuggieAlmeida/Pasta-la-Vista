import { Request, Response, NextFunction } from 'express';
import { authService, AuthResponse } from './auth.service';
import { RegisterInput, LoginInput, RefreshInput } from './auth.schema';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  body: any;
}

export const authController = {
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: RegisterInput = req.body;
      const response: AuthResponse = await authService.register(dto);

      res.status(201).json({
        status: 'success',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: LoginInput = req.body;
      const response: AuthResponse = await authService.login(dto);

      res.status(200).json({
        status: 'success',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: RefreshInput = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Usuário não autenticado',
        });
        return;
      }

      const response = await authService.refreshToken(userId, dto.refresh_token);

      res.status(200).json({
        status: 'success',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Usuário não autenticado',
        });
        return;
      }

      await authService.logout(userId);

      res.status(200).json({
        status: 'success',
        message: 'Logout realizado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Usuário não autenticado',
        });
        return;
      }

      await authService.deleteAccount(userId);

      res.status(200).json({
        status: 'success',
        message: 'Conta deletada e dados anonimizados de acordo com a LGPD.',
      });
    } catch (error) {
      next(error);
    }
  },
};
