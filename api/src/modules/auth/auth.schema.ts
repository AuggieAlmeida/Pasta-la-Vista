import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número'),
  phone: z.string()
    .regex(/^\+?[0-9\s()-]{8,}$/, 'Telefone inválido')
    .optional(),
});

export const LoginSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Email inválido'),
  password: z.string()
    .min(1, 'Senha obrigatória'),
});

export const RefreshSchema = z.object({
  refresh_token: z.string()
    .min(1, 'Refresh token obrigatório'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshInput = z.infer<typeof RefreshSchema>;
