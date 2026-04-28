import { z } from 'zod';

export const CreateCouponSchema = z
  .object({
    code: z.string().min(2, 'Código muito curto').max(40, 'Código muito longo').trim(),
    discountType: z.enum(['PERCENTAGE', 'FIXED']),
    discountValue: z.number().positive('Valor deve ser positivo'),
    usageLimit: z.number().int().positive().optional().nullable(),
  })
  .refine(
    (data) => !(data.discountType === 'PERCENTAGE' && data.discountValue > 100),
    { message: 'Porcentagem não pode ser maior que 100', path: ['discountValue'] }
  );

export const UpdateCouponActiveSchema = z.object({
  active: z.boolean(),
});

export type CreateCouponInput = z.infer<typeof CreateCouponSchema>;
export type UpdateCouponActiveInput = z.infer<typeof UpdateCouponActiveSchema>;
