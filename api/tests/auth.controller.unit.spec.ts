// auth.controller.unit.spec.ts
jest.mock('../src/modules/auth/auth.service', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  },
}));

import { authController } from '../src/modules/auth/auth.controller';
import { authService } from '../src/modules/auth/auth.service';

const mockedService = authService as any;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('modules/auth/auth.controller', () => {
  describe('register', () => {
    it('retorna 201 e dados quando sucesso', async () => {
      const dto = { name: 'u', email: 'a@b.com', password: 'Aa12345678' };
      const response = { user: { id: 'u1', name: 'u', email: 'a@b.com', role: 'CLIENT' }, access_token: 'a', refresh_token: 'r' };
      mockedService.register.mockResolvedValue(response);

      const req: any = { body: dto };
      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res: any = { status };
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(status).toHaveBeenCalledWith(201);
      expect(json).toHaveBeenCalledWith({ status: 'success', data: response });
      expect(next).not.toHaveBeenCalled();
    });

    it('encaminha erro para next quando service falha', async () => {
      mockedService.register.mockRejectedValue(new Error('boom'));

      const req: any = { body: {} };
      const res: any = {};
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('retorna 200 e dados quando sucesso', async () => {
      const dto = { email: 'a@b.com', password: 'pwd' };
      const response = { user: { id: 'u1', name: 'u', email: 'a@b.com', role: 'CLIENT' }, access_token: 'a', refresh_token: 'r' };
      mockedService.login.mockResolvedValue(response);

      const req: any = { body: dto };
      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res: any = { status };
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ status: 'success', data: response });
      expect(next).not.toHaveBeenCalled();
    });

    it('encaminha erro para next quando service falha', async () => {
      mockedService.login.mockRejectedValue(new Error('boom'));

      const req: any = { body: {} };
      const res: any = {};
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('retorna 401 quando user não autenticado', async () => {
      const req: any = { body: { refresh_token: 'r' }, user: undefined };
      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res: any = { status };
      const next = jest.fn();

      await authController.refresh(req, res, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ status: 'error', message: 'Usuário não autenticado' });
    });

    it('retorna 200 com tokens quando sucesso', async () => {
      const req: any = { body: { refresh_token: 'r' }, user: { id: 'u1' } };
      const response = { access_token: 'a', refresh_token: 'r2' };
      mockedService.refreshToken.mockResolvedValue(response);

      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res: any = { status };
      const next = jest.fn();

      await authController.refresh(req, res, next);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ status: 'success', data: response });
    });

    it('encaminha erro para next quando service falha', async () => {
      const req: any = { body: { refresh_token: 'r' }, user: { id: 'u1' } };
      mockedService.refreshToken.mockRejectedValue(new Error('boom'));

      const res: any = {};
      const next = jest.fn();

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('retorna 401 quando user não autenticado', async () => {
      const req: any = { user: undefined };
      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res: any = { status };
      const next = jest.fn();

      await authController.logout(req, res, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ status: 'error', message: 'Usuário não autenticado' });
    });

    it('chama service.logout e retorna 200 quando sucesso', async () => {
      const req: any = { user: { id: 'u1' } };
      mockedService.logout.mockResolvedValue(undefined);

      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res: any = { status };
      const next = jest.fn();

      await authController.logout(req, res, next);

      expect(mockedService.logout).toHaveBeenCalledWith('u1');
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ status: 'success', message: 'Logout realizado com sucesso' });
    });
  });
});
