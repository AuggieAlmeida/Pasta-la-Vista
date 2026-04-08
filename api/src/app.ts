import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth.routes';

const app: Express = express();

// Middleware de CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:8081'],
  credentials: true,
}));

// Middleware de parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por janela
  message: 'Muitas requisições, tente novamente depois.',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // limite menor para auth
  message: 'Muitas tentativas de autenticação, tente novamente depois.',
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

// Routes
app.use('/api/v1/auth', authLimiter, authRouter);

// Placeholder routers (virão em sprints futuros)
// app.use('/api/v1/menu', menuRouter);
// app.use('/api/v1/orders', orderRouter);
// app.use('/api/v1/stock', stockRouter);

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
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message,
  });
});

export default app;
