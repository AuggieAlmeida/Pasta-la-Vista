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
  delivery_mode: z.enum(['DELIVERY', 'PICKUP', 'DINE_IN']).default('DELIVERY'),
  table_number: z.string().optional(),
  coupon_code: z.string().optional(),
  address_id: z.string().optional(),
  notes: z.string().max(1000, 'Notas devem ter no maximo 1000 caracteres').optional().default(''),
  payment_method: z.enum(['PIX', 'CREDIT_CARD', 'CASH'], {
    errorMap: () => ({ message: 'Metodo de pagamento invalido' }),
  }),
}).refine(data => {
  if (data.delivery_mode === 'DELIVERY' && !data.address_id) {
    return false;
  }
  return true;
}, { message: "Endereço é obrigatório para entrega", path: ["address_id"] })
.refine(data => {
  if (data.delivery_mode === 'DINE_IN' && !data.table_number) {
    return false;
  }
  return true;
}, { message: "Número da mesa é obrigatório para consumo no local", path: ["table_number"] });


export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
