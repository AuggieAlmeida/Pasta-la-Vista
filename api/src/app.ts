import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth.routes';
import menuRouter from './routes/menu.routes';
import orderRouter from './routes/order.routes';
import docsRouter from './docs/docs.routes';
import { AppError } from './utils/errors';

const app: Express = express();

// Middleware de CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGIN?.split(',') || [])
    : true, // Permitir qualquer origem em desenvolvimento (mobile, simulador, etc.)
  credentials: true,
}));

// Middleware de parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisicoes por janela
  message: 'Muitas requisicoes, tente novamente depois.',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // limite menor para auth
  message: 'Muitas tentativas de autenticacao, tente novamente depois.',
});

app.use(limiter);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Documentation (Swagger, ReDoc, API Reference)
app.use('/docs', docsRouter);

// Routes
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/menu', menuRouter);
app.use('/api/v1/orders', orderRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Rota não encontrada',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Erro:', err);

  // Check if it's an AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { details: err.details }),
    });
    return;
  }

  // Default to 500 for unknown errors
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message,
  });
});

export default app;
