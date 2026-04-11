import { z } from 'zod';

export const CreateOrderSchema = z.object({
  items: z.array(
    z.object({
      product_id: z.string().min(1, 'ID do produto e obrigatorio'),
      quantity: z.number()
        .int('Quantidade deve ser inteiro')
        .min(1, 'Quantidade minima e 1'),
      customizations: z.array(
        z.object({
          customization_id: z.string().min(1, 'ID da customizacao e obrigatorio'),
          price_modifier: z.number().min(0).default(0),
        })
      ).optional().default([]),
      obs: z.string().max(500, 'Observacao deve ter no maximo 500 caracteres').optional(),
    })
  ).min(1, 'Pedido deve ter pelo menos 1 item'),
  address: z.object({
    street: z.string().min(3, 'Rua e obrigatoria'),
    number: z.string().min(1, 'Numero e obrigatorio'),
    complement: z.string().max(200).optional(),
    city: z.string().min(2, 'Cidade e obrigatoria'),
    state: z.string().length(2, 'Estado deve ter 2 caracteres'),
    zip: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP invalido'),
  }),
  notes: z.string().max(1000, 'Notas devem ter no maximo 1000 caracteres').optional().default(''),
  payment_method: z.enum(['PIX', 'CREDIT_CARD', 'CASH'], {
    errorMap: () => ({ message: 'Metodo de pagamento invalido' }),
  }),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
