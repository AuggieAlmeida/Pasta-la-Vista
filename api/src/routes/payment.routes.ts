import { Router } from 'express';
import { paymentController } from '../modules/payment/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateMiddleware } from '../middleware/validate.middleware';
import { CreateCheckoutSchema } from '../modules/payment/payment.schema';

const paymentRouter = Router();

// POST /api/v1/pagamento/checkout — Criar PaymentIntent (auth: client)
paymentRouter.post(
  '/checkout',
  authMiddleware,
  validateMiddleware(CreateCheckoutSchema),
  (req, res, next) => paymentController.createCheckout(req, res, next)
);

// NOTA: O webhook NÃO é registrado aqui.
// Ele é registrado diretamente em app.ts com express.raw() ANTES do express.json().
// Isso é necessário porque Stripe precisa do body cru (Buffer) para validar a assinatura.

export default paymentRouter;
