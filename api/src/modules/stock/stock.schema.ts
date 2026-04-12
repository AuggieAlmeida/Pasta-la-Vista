import { z } from 'zod';

/**
 * Schema para atualização de estoque
 */
export const UpdateStockSchema = z.object({
  quantity: z.number().int().min(0, 'Quantidade não pode ser negativa'),
  minQuantity: z.number().int().min(0).optional(),
});

export type UpdateStockInput = z.infer<typeof UpdateStockSchema>;
