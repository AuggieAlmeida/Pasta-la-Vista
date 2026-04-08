// auth.middleware.unit.spec.ts
jest.mock('../src/utils/jwt', () => ({
  verifyAccessToken: jest.fn(),
}));

import { authMiddleware, optionalAuthMiddleware } from '../src/middleware/auth.middleware';
import { verifyAccessToken } from '../src/utils/jwt';

const mockedVerify = verifyAccessToken as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('middleware/auth.middleware', () => {
  describe('authMiddleware', () => {
    it('anexa user e chama next quando header válido', () => {
      mockedVerify.mockReturnValue({ userId: 'u1', email: 'u@x.com', role: 'CLIENT' });

      const req: any = { headers: { authorization: 'Bearer valid' } };
      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res: any = { status };
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(req.user).toEqual({ id: 'u1', email: 'u@x.com', role: 'CLIENT' });
      expect(next).toHaveBeenCalled();
    });

    it('retorna 401 quando não há Authorization header', () => {
      const req: any = { headers: {} };
      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res: any = { status };
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ status: 'error', message: 'Bearer token não fornecido' });
      expect(next).not.toHaveBeenCalled();
    });

    it('retorna 401 quando formato de bearer inválido', () => {
      const req: any = { headers: { authorization: 'Token abc' } };
      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res: any = { status };
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ status: 'error', message: 'Formato de autenticação inválido' });
      expect(next).not.toHaveBeenCalled();
    });

    it('retorna 401 quando verifyAccessToken lança erro', () => {
      mockedVerify.mockImplementation(() => {
        throw new Error('token inválido');
      });

      const req: any = { headers: { authorization: 'Bearer bad' } };
      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res: any = { status };
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ status: 'error', message: 'token inválido' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('anexa user quando header válido e continua', () => {
      mockedVerify.mockReturnValue({ userId: 'u1', email: 'u@x.com', role: 'CLIENT' });

      const req: any = { headers: { authorization: 'Bearer token' } };
      const res: any = {};
      const next = jest.fn();

      optionalAuthMiddleware(req, res, next);

      expect(req.user).toEqual({ id: 'u1', email: 'u@x.com', role: 'CLIENT' });
      expect(next).toHaveBeenCalled();
    });

    it('ignora errors silenciosamente e chama next', () => {
      mockedVerify.mockImplementation(() => {
        throw new Error('boom');
      });

      const req: any = { headers: { authorization: 'Bearer bad' } };
      const res: any = {};
      const next = jest.fn();

      optionalAuthMiddleware(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('continua quando não há header', () => {
      const req: any = { headers: {} };
      const res: any = {};
      const next = jest.fn();

      optionalAuthMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
