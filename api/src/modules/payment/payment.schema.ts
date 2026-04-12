import { z } from 'zod';

/**
 * Schema para criação de checkout (PaymentIntent)
 */
export const CreateCheckoutSchema = z.object({
  orderId: z.string().uuid('ID do pedido inválido'),
  /** ID do cartão salvo em `user_cards` (mesmo escolhido no checkout). */
  savedCardId: z.string().uuid().optional(),
});

/**
 * Schema para atualização de status de pagamento (interno)
 */
export const ConfirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'PaymentIntent ID é obrigatório'),
  orderId: z.string().uuid('ID do pedido inválido'),
  amount: z.number().positive('Valor deve ser positivo'),
});

export type CreateCheckoutInput = z.infer<typeof CreateCheckoutSchema>;
export type ConfirmPaymentInput = z.infer<typeof ConfirmPaymentSchema>;
