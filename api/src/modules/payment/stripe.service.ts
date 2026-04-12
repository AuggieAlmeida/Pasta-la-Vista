import Stripe from 'stripe';
import { prisma } from '../../config/database';
import { OrderLog } from '../orders/order.model';
import { NotFoundError, AppError } from '../../utils/errors';
import { Decimal } from '@prisma/client/runtime/library';

// Inicializa o Stripe apenas se a chave estiver configurada
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia',
    })
  : null;

function getStripe(): Stripe {
  if (!stripe) {
    throw new AppError('Stripe não configurado. Verifique STRIPE_SECRET_KEY.', 500);
  }
  return stripe;
}

async function ensureStripeCustomer(
  s: Stripe,
  userId: string
): Promise<{ customerId: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await s.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  return { customerId };
}

/**
 * PaymentMethods criados no app (Payment Sheet / CardField) ficam presos a um PaymentIntent
 * até ele ser concluído ou cancelado. Sem liberar, attach falha com:
 * "currently attached to a PaymentIntent ... setup_future_usage".
 */
async function cancelIncompleteIntentsUsingPaymentMethod(
  s: Stripe,
  paymentMethodId: string,
  userId: string
): Promise<void> {
  const cancellable: Stripe.PaymentIntent.Status[] = [
    'requires_payment_method',
    'requires_confirmation',
    'requires_action',
    'processing',
  ];

  const escapeQueryValue = (v: string) => v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  const query = `payment_method:'${escapeQueryValue(paymentMethodId)}' AND metadata['userId']:'${escapeQueryValue(userId)}'`;

  try {
    type SearchPage = Awaited<ReturnType<Stripe['paymentIntents']['search']>>;
    let page: SearchPage = await s.paymentIntents.search({ query, limit: 100 });

    for (;;) {
      for (const pi of page.data) {
        if (!cancellable.includes(pi.status)) continue;
        try {
          await s.paymentIntents.cancel(pi.id);
        } catch {
          /* já terminal ou não cancelável */
        }
      }
      if (!page.has_more) break;
      page = await s.paymentIntents.search({
        query,
        limit: 100,
        page: page.next_page!,
      });
    }
  } catch (err) {
    console.warn('Stripe PaymentIntent.search (liberar PM):', err);
  }
}

/**
 * Garante Customer Stripe e anexa o PaymentMethod a ele.
 * Cancela antes, se necessário, PIs incompletos do mesmo usuário que ainda seguram o PM.
 */
async function ensureCustomerAndAttachedPaymentMethod(
  s: Stripe,
  userId: string,
  stripePaymentMethodId: string
): Promise<string> {
  const { customerId } = await ensureStripeCustomer(s, userId);

  const pm = await s.paymentMethods.retrieve(stripePaymentMethodId);

  if (pm.customer) {
    if (pm.customer !== customerId) {
      throw new AppError(
        'Este cartão está vinculado a outra conta Stripe. Cadastre o cartão novamente.',
        400
      );
    }
    return customerId;
  }

  await cancelIncompleteIntentsUsingPaymentMethod(s, stripePaymentMethodId, userId);

  try {
    await s.paymentMethods.attach(stripePaymentMethodId, { customer: customerId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('attached to a PaymentIntent')) {
      await cancelIncompleteIntentsUsingPaymentMethod(s, stripePaymentMethodId, userId);
      try {
        await s.paymentMethods.attach(stripePaymentMethodId, { customer: customerId });
      } catch {
        throw new AppError(
          'Este cartão ainda está ligado a um pagamento em aberto. Escolha "Outro cartão" ou cadastre o cartão de novo em Perfil.',
          400
        );
      }
    } else {
      throw err;
    }
  }

  return customerId;
}

export const stripeService = {
  /**
   * Cria um PaymentIntent no Stripe para um pedido existente.
   * O amount é calculado no servidor a partir do Order.total.
   */
  async createPaymentIntent(orderId: string, userId: string, savedCardId?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundError('Pedido não encontrado');
    }

    // Verificar que o pedido pertence ao usuário
    if (order.userId !== userId) {
      throw new NotFoundError('Pedido não encontrado');
    }

    // Verificar se já não foi pago
    if (order.status === 'CONFIRMED' || order.payment) {
      throw new AppError('Este pedido já foi pago', 400);
    }

    // Verificar status do pedido
    if (order.status !== 'PENDING') {
      throw new AppError(`Não é possível pagar um pedido com status ${order.status}`, 400);
    }

    const s = getStripe();

    // Stripe trabalha com centavos (amount em centavos)
    const amountInCents = Math.round(Number(order.total) * 100);

    let stripePaymentMethodId: string | undefined;

    if (savedCardId) {
      const card = await prisma.userCard.findFirst({
        where: { id: savedCardId, userId },
      });
      if (!card) {
        throw new NotFoundError('Cartão não encontrado');
      }
      if (!card.stripePaymentMethodId || card.stripePaymentMethodId === 'pm_mock') {
        throw new AppError('Este cartão não pode ser usado no Stripe. Cadastre o cartão novamente.', 400);
      }
      stripePaymentMethodId = card.stripePaymentMethodId;
    }

    let stripeCustomerId: string | undefined;
    if (stripePaymentMethodId) {
      stripeCustomerId = await ensureCustomerAndAttachedPaymentMethod(
        s,
        userId,
        stripePaymentMethodId
      );
    }

    const paymentIntent = await s.paymentIntents.create({
      amount: amountInCents,
      currency: 'brl',
      metadata: {
        orderId: order.id,
        userId: order.userId,
      },
      ...(stripePaymentMethodId
        ? {
            customer: stripeCustomerId,
            payment_method: stripePaymentMethodId,
            payment_method_types: ['card' as const],
            setup_future_usage: 'on_session',
          }
        : {
            automatic_payment_methods: {
              enabled: true,
            },
          }),
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      paymentIntentId: paymentIntent.id,
      amount: Number(order.total),
      paymentMethodId: stripePaymentMethodId,
    };
  },

  /**
   * Verifica a assinatura do webhook Stripe.
   * Requer o body raw (Buffer) e o header stripe-signature.
   */
  verifyWebhookSignature(body: Buffer, signature: string): Stripe.Event {
    const s = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new AppError('Webhook secret não configurado', 500);
    }

    try {
      return s.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      throw new AppError(`Assinatura do webhook inválida: ${(err as Error).message}`, 400);
    }
  },

  /**
   * Confirma o pagamento após receber o webhook payment_intent.succeeded.
   * Cria registro Payment no PostgreSQL e atualiza o status do Order.
   */
  async confirmPayment(paymentIntentId: string, amount: number, orderId: string) {
    // Verificar se já existe um Payment para este pedido (idempotência)
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (existingPayment) {
      console.log(`Payment já registrado para orderId: ${orderId}`);
      return existingPayment;
    }

    // Transação atômica: cria Payment + atualiza Order
    const result = await prisma.$transaction(async (tx) => {
      // Criar registro de Payment
      const payment = await tx.payment.create({
        data: {
          orderId,
          stripePaymentId: paymentIntentId,
          status: 'succeeded',
          amount: new Decimal((amount / 100).toFixed(2)), // Stripe envia em centavos
        },
      });

      // Atualizar status do Order
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          paidAt: new Date(),
        },
      });

      return payment;
    });

    // Registrar log no MongoDB (status history)
    try {
      await OrderLog.findOneAndUpdate(
        { order_id: orderId },
        {
          $push: {
            status_history: {
              status: 'CONFIRMED',
              changed_at: new Date(),
              changed_by: 'stripe_webhook',
            },
          },
          $set: { status: 'CONFIRMED' },
        }
      );
    } catch (err) {
      // Log de erro mas não falha a confirmação — o PostgreSQL é a fonte de verdade
      console.error('Erro ao atualizar log MongoDB:', err);
    }

    return result;
  },
};
