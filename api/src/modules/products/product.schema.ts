import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter no minimo 2 caracteres')
    .max(200, 'Nome deve ter no maximo 200 caracteres'),
  description: z.string()
    .max(1000, 'Descricao deve ter no maximo 1000 caracteres')
    .optional()
    .default(''),
  price: z.number()
    .positive('Preco deve ser maior que zero')
    .max(99999, 'Preco maximo excedido'),
  image: z.string().url('URL da imagem invalida').optional().default(''),
  category: z.enum(['pizzas', 'bebidas', 'sobremesas', 'massas', 'aperitivos'], {
    errorMap: () => ({ message: 'Categoria invalida' }),
  }),
  active: z.boolean().optional().default(true),
  preparation_time: z.number()
    .int('Tempo de preparo deve ser inteiro')
    .min(1, 'Tempo de preparo minimo e 1 minuto')
    .optional()
    .default(30),
  customizations: z.array(
    z.object({
      type: z.enum(['size', 'ingredient'], {
        errorMap: () => ({ message: 'Tipo de customizacao invalido' }),
      }),
      name: z.string().min(1, 'Nome da customizacao e obrigatorio'),
      price_modifier: z.number().min(0, 'Modificador de preco nao pode ser negativo').default(0),
      available: z.boolean().default(true),
    })
  ).optional().default([]),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Termo de busca e obrigatorio'),
});

export const CategoryParamSchema = z.object({
  category: z.enum(['pizzas', 'bebidas', 'sobremesas', 'massas', 'aperitivos'], {
    errorMap: () => ({ message: 'Categoria invalida' }),
  }),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
