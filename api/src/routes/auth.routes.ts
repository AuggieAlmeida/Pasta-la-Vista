import { Router } from 'express';
import { authController } from '../modules/auth/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateMiddleware } from '../middleware/validate.middleware';
import { RegisterSchema, LoginSchema, RefreshSchema } from '../modules/auth/auth.schema';

const authRouter = Router();

// Rota pública: Registro
authRouter.post(
  '/register',
  validateMiddleware(RegisterSchema),
  (req, res, next) => authController.register(req, res, next)
);

// Rota pública: Login
authRouter.post(
  '/login',
  validateMiddleware(LoginSchema),
  (req, res, next) => authController.login(req, res, next)
);

// Rota protegida: Refresh Token
authRouter.post(
  '/refresh',
  validateMiddleware(RefreshSchema),
  authMiddleware,
  (req, res, next) => authController.refresh(req, res, next)
);

// Rota protegida: Logout
authRouter.post(
  '/logout',
  authMiddleware,
  (req, res, next) => authController.logout(req, res, next)
);

export default authRouter;
