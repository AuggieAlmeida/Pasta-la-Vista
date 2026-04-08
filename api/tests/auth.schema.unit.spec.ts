// auth.schema.unit.spec.ts
import { RegisterSchema, LoginSchema, RefreshSchema } from '../src/modules/auth/auth.schema';

describe('modules/auth/auth.schema', () => {
  it('aceita dados válidos para registro', () => {
    const dto = {
      name: 'Usuario Teste',
      email: 'test@example.com',
      password: 'Aa12345678',
    };

    expect(() => RegisterSchema.parse(dto)).not.toThrow();
  });

  it('rejeita registro com senha inválida', () => {
    const dto = {
      name: 'x',
      email: 'not-an-email',
      password: 'short',
    };

    expect(() => RegisterSchema.parse(dto)).toThrow();
  });

  it('aceita dados válidos para login', () => {
    const dto = { email: 'a@b.com', password: '1' };
    expect(() => LoginSchema.parse(dto)).not.toThrow();
  });

  it('rejeita login inválido', () => {
    const dto = { email: 'bad', password: '' };
    expect(() => LoginSchema.parse(dto)).toThrow();
  });

  it('aceita refresh token válido', () => {
    const dto = { refresh_token: 'tok' };
    expect(() => RefreshSchema.parse(dto)).not.toThrow();
  });

  it('rejeita refresh token vazio', () => {
    const dto = { refresh_token: '' };
    expect(() => RefreshSchema.parse(dto)).toThrow();
  });
});
