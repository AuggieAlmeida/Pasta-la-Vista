// auth.service.unit.spec.ts
jest.mock('../src/config/database', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  const redis = {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };
  return { prisma, redis };
});

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../src/utils/jwt', () => ({
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

import { authService } from '../src/modules/auth/auth.service';
import { prisma, redis } from '../src/config/database';
import bcrypt from 'bcrypt';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../src/utils/jwt';

const mockedPrisma = prisma as any;
const mockedRedis = redis as any;
const mockedBcrypt = bcrypt as any;
const mockedJwtUtils = {
  signAccessToken: signAccessToken as jest.Mock,
  signRefreshToken: signRefreshToken as jest.Mock,
  verifyRefreshToken: verifyRefreshToken as jest.Mock,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('modules/auth/auth.service', () => {
  describe('register', () => {
    it('lança erro quando email já cadastrado', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@b.com' });

      await expect(
        authService.register({ name: 'x', email: 'a@b.com', password: 'Aa12345678' } as any)
      ).rejects.toThrow('Email já cadastrado');
    });

    it('cria usuário, gera tokens e armazena refresh no redis', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedpw');
      const createdUser = { id: 'u1', name: 'u', email: 'a@b.com', passwordHash: 'hashedpw', phone: 'p', role: 'CLIENT' };
      mockedPrisma.user.create.mockResolvedValue(createdUser);
      mockedJwtUtils.signAccessToken.mockReturnValue('access123');
      mockedJwtUtils.signRefreshToken.mockReturnValue('refresh123');

      const res = await authService.register({ name: 'u', email: 'a@b.com', password: 'Aa12345678', phone: 'p' } as any);

      expect(res.access_token).toBe('access123');
      expect(res.refresh_token).toBe('refresh123');
      expect(mockedRedis.setex).toHaveBeenCalledWith(`refresh_token:${createdUser.id}`, 7 * 24 * 60 * 60, 'refresh123');
    });
  });

  describe('login', () => {
    it('lança erro quando usuário não existe', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login({ email: 'no@pe.com', password: 'x' } as any)).rejects.toThrow('Credenciais inválidas');
    });

    it('lança erro quando senha inválida', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', passwordHash: 'h' });
      mockedBcrypt.compare.mockResolvedValue(false);

      await expect(authService.login({ email: 'a@b.com', password: 'bad' } as any)).rejects.toThrow('Credenciais inválidas');
    });

    it('gera tokens e armazena refresh no redis quando sucesso', async () => {
      const user = { id: 'u1', name: 'u', email: 'a@b.com', passwordHash: 'h', role: 'CLIENT' };
      mockedPrisma.user.findUnique.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true);
      mockedJwtUtils.signAccessToken.mockReturnValue('access-login');
      mockedJwtUtils.signRefreshToken.mockReturnValue('refresh-login');

      const res = await authService.login({ email: 'a@b.com', password: 'good' } as any);

      expect(res.access_token).toBe('access-login');
      expect(res.refresh_token).toBe('refresh-login');
      expect(mockedRedis.setex).toHaveBeenCalledWith(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, 'refresh-login');
    });
  });

  describe('refreshToken', () => {
    it('lança erro quando verifyRefreshToken falha', async () => {
      mockedJwtUtils.verifyRefreshToken.mockImplementation(() => {
        throw new Error('bad');
      });

      await expect(authService.refreshToken('u1', 'rt')).rejects.toThrow('Refresh token inválido');
    });

    it('lança erro quando token não confere com o armazenado no redis', async () => {
      mockedJwtUtils.verifyRefreshToken.mockReturnValue({ userId: 'u1' });
      mockedRedis.get.mockResolvedValue('different');

      await expect(authService.refreshToken('u1', 'rt')).rejects.toThrow('Refresh token não encontrado ou expirou');
    });

    it('lança erro quando usuário não encontrado', async () => {
      mockedJwtUtils.verifyRefreshToken.mockReturnValue({ userId: 'u1' });
      mockedRedis.get.mockResolvedValue('rt');
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.refreshToken('u1', 'rt')).rejects.toThrow('Usuário não encontrado');
    });

    it('rotaciona tokens quando tudo válido', async () => {
      const user = { id: 'u1', email: 'a@b.com', role: 'CLIENT' };
      mockedJwtUtils.verifyRefreshToken.mockReturnValue({ userId: 'u1' });
      mockedRedis.get.mockResolvedValue('rt');
      mockedPrisma.user.findUnique.mockResolvedValue(user);
      mockedJwtUtils.signAccessToken.mockReturnValue('new-access');
      mockedJwtUtils.signRefreshToken.mockReturnValue('new-refresh');

      const out = await authService.refreshToken('u1', 'rt');

      expect(out.access_token).toBe('new-access');
      expect(out.refresh_token).toBe('new-refresh');
      expect(mockedRedis.setex).toHaveBeenCalledWith(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, 'new-refresh');
    });
  });

  describe('logout', () => {
    it('deleta refresh token do redis', async () => {
      mockedRedis.del.mockResolvedValue(1);

      await authService.logout('u1');

      expect(mockedRedis.del).toHaveBeenCalledWith(`refresh_token:u1`);
    });
  });
});
