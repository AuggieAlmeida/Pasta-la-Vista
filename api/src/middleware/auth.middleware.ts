import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, decodeToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        status: 'error',
        message: 'Bearer token não fornecido',
      });
      return;
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer') {
      res.status(401).json({
        status: 'error',
        message: 'Formato de autenticação inválido',
      });
      return;
    }

    // Verificar token
    const payload = verifyAccessToken(token);

    // Anexar user ao request
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: (error as Error).message || 'Token inválido ou expirado',
    });
  }
};

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const [bearer, token] = authHeader.split(' ');

      if (bearer === 'Bearer') {
        const payload = verifyAccessToken(token);
        req.user = {
          id: payload.userId,
          email: payload.email,
          role: payload.role,
        };
      }
    }
  } catch {
    // Falha silenciosamente em middleware opcional
  }

  next();
};
