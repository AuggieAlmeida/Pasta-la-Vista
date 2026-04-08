// validate.middleware.unit.spec.ts
import { validateMiddleware } from '../src/middleware/validate.middleware';
import { z } from 'zod';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('middleware/validate.middleware', () => {
  it('valida e chama next quando os dados são válidos', () => {
    const schema = z.object({ name: z.string() });
    const req: any = { body: { name: 'Alice' } };
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res: any = { status };
    const next = jest.fn();

    const mw = validateMiddleware(schema);
    mw(req, res, next);

    expect(req.body).toEqual({ name: 'Alice' });
    expect(next).toHaveBeenCalled();
  });

  it('retorna 400 com erros formatados quando inválido', () => {
    const schema = z.object({ name: z.string() });
    const req: any = { body: {} };
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res: any = { status };
    const next = jest.fn();

    const mw = validateMiddleware(schema);
    mw(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Dados inválidos',
        errors: expect.any(Array),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
