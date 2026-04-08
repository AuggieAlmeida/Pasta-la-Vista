// jwt.unit.spec.ts
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
}));

import jwt from 'jsonwebtoken';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
} from '../src/utils/jwt';

const mockedJwt = jwt as unknown as { sign: jest.Mock; verify: jest.Mock; decode: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('utils/jwt', () => {
  describe('signAccessToken', () => {
    it('gera access token usando jwt.sign', () => {
      mockedJwt.sign.mockReturnValue('access-token');

      const token = signAccessToken('user1', 'u@example.com', 'CLIENT');

      expect(token).toBe('access-token');
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: 'user1', email: 'u@example.com', role: 'CLIENT' },
        expect.any(String),
        expect.objectContaining({ algorithm: 'HS256' }) as any
      );
    });
  });

  describe('signRefreshToken', () => {
    it('gera refresh token usando jwt.sign', () => {
      mockedJwt.sign.mockReturnValue('refresh-token');

      const token = signRefreshToken('user1');

      expect(token).toBe('refresh-token');
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: 'user1' },
        expect.any(String),
        expect.objectContaining({ algorithm: 'HS256' }) as any
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('retorna payload quando jwt.verify é válido', () => {
      const payload = { userId: 'u1', email: 'u@x.com', role: 'CLIENT' };
      mockedJwt.verify.mockReturnValue(payload);

      const result = verifyAccessToken('token');

      expect(result).toEqual(payload);
      expect(mockedJwt.verify).toHaveBeenCalledWith('token', expect.any(String));
    });

    it('lança erro quando jwt.verify lança', () => {
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('boom');
      });

      expect(() => verifyAccessToken('token')).toThrow('Token inválido ou expirado');
    });
  });

  describe('verifyRefreshToken', () => {
    it('retorna objeto com userId quando válido', () => {
      mockedJwt.verify.mockReturnValue({ userId: 'u1' });

      const result = verifyRefreshToken('refresh');

      expect(result).toEqual({ userId: 'u1' });
      expect(mockedJwt.verify).toHaveBeenCalledWith('refresh', expect.any(String));
    });

    it('lança erro quando inválido', () => {
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('boom');
      });

      expect(() => verifyRefreshToken('refresh')).toThrow('Refresh token inválido ou expirado');
    });
  });

  describe('decodeToken', () => {
    it('retorna payload quando jwt.decode retorna payload', () => {
      const payload = { userId: 'u1', email: 'e', role: 'CLIENT' };
      mockedJwt.decode.mockReturnValue(payload);

      expect(decodeToken('tok')).toEqual(payload);
      expect(mockedJwt.decode).toHaveBeenCalledWith('tok');
    });

    it('retorna null quando jwt.decode lança erro', () => {
      mockedJwt.decode.mockImplementation(() => {
        throw new Error('boom');
      });

      expect(decodeToken('tok')).toBeNull();
    });
  });
});
