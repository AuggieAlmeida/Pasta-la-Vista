// role.middleware.unit.spec.ts
import { roleMiddleware } from '../src/middleware/role.middleware';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('middleware/role.middleware', () => {
  it('retorna 401 quando usuário não autenticado', () => {
    const req: any = {};
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res: any = { status };
    const next = jest.fn();

    const mw = roleMiddleware(['ADMIN']);
    mw(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ status: 'error', message: 'Usuário não autenticado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 403 quando role não autorizada', () => {
    const req: any = { user: { id: '1', role: 'CLIENT' } };
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res: any = { status };
    const next = jest.fn();

    const mw = roleMiddleware(['ADMIN']);
    mw(req, res, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ status: 'error', message: 'Acesso negado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('chama next quando role autorizada', () => {
    const req: any = { user: { id: '1', role: 'ADMIN' } };
    const res: any = {};
    const next = jest.fn();

    const mw = roleMiddleware(['ADMIN']);
    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
