import { Request, Response, NextFunction } from 'express';
import { stripeService } from './stripe.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export const paymentController = {
  /**
   * POST /api/v1/pagamento/checkout
   * Cria um PaymentIntent no Stripe e retorna o client_secret.
   * Auth: Client
   */
  async createCheckout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { orderId, savedCardId } = req.body;

      const result = await stripeService.createPaymentIntent(orderId, userId, savedCardId);

      res.status(200).json({
        status: 'success',
        data: {
          clientSecret: result.clientSecret,
          publishableKey: result.publishableKey,
          paymentIntentId: result.paymentIntentId,
          amount: result.amount,
          ...(result.paymentMethodId ? { paymentMethodId: result.paymentMethodId } : {}),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/pagamento/webhook
   * Recebe eventos do Stripe (webhook).
   * Sem autenticação — apenas validação de assinatura Stripe.
   * IMPORTANTE: Requer body raw (Buffer).
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        res.status(400).json({
          status: 'error',
          message: 'Header stripe-signature ausente',
        });
        return;
      }

      // req.body é Buffer (raw) graças ao middleware express.raw()
      const event = stripeService.verifyWebhookSignature(req.body, signature);

      // Processar evento
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          const orderId = paymentIntent.metadata.orderId;

          if (!orderId) {
            console.error('Webhook: PaymentIntent sem orderId nos metadata');
            res.status(400).json({ status: 'error', message: 'orderId ausente nos metadata' });
            return;
          }

          await stripeService.confirmPayment(
            paymentIntent.id,
            paymentIntent.amount,
            orderId
          );

          console.log(`Pagamento confirmado para order: ${orderId}`);
          break;
        }

        case 'payment_intent.payment_failed': {
          const failedIntent = event.data.object;
          console.log(`Pagamento falhou para PI: ${failedIntent.id}`);
          // Não atualizar Order — manter PENDING para retry
          break;
        }

        case 'payment_intent.created':
          // Informativo; confirmação do pedido ocorre em payment_intent.succeeded
          break;

        default:
          console.log(`Webhook event não processado: ${event.type}`);
      }

      // Sempre retornar 200 para o Stripe não reenviar
      res.status(200).json({ received: true });
    } catch (error) {
      next(error);
    }
  },
};
