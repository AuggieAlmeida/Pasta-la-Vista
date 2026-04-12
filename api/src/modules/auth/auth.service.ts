import bcrypt from 'bcrypt';
import { prisma, redis } from '../../config/database';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { RegisterInput, LoginInput } from './auth.schema';
import { ValidationError, UnauthorizedError, NotFoundError } from '../../utils/errors';
import { OrderLog } from '../orders/order.model';

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 dias em segundos

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  access_token: string;
  refresh_token: string;
}

export const authService = {
  async register(dto: RegisterInput): Promise<AuthResponse> {
    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ValidationError('Email já cadastrado');
    }

    // Hash senha
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        role: 'CLIENT',
      },
    });

    // Gerar tokens
    const access_token = signAccessToken(user.id, user.email, user.role as 'CLIENT' | 'ADMIN');
    const refresh_token = signRefreshToken(user.id);

    // Armazenar refresh token no Redis
    if (!redis) {
      throw new Error('Redis não inicializado');
    }
    await redis.setex(
      `refresh_token:${user.id}`,
      REFRESH_TOKEN_TTL,
      refresh_token
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      access_token,
      refresh_token,
    };
  },

  async login(dto: LoginInput): Promise<AuthResponse> {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new ValidationError('Credenciais inválidas');
    }

    // Validar senha
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new ValidationError('Credenciais inválidas');
    }

    // Gerar tokens
    const access_token = signAccessToken(user.id, user.email, user.role as 'CLIENT' | 'ADMIN');
    const refresh_token = signRefreshToken(user.id);

    // Armazenar refresh token no Redis
    if (!redis) {
      throw new Error('Redis não inicializado');
    }
    await redis.setex(
      `refresh_token:${user.id}`,
      REFRESH_TOKEN_TTL,
      refresh_token
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      access_token,
      refresh_token,
    };
  },

  async refreshToken(userId: string, refresh_token: string): Promise<{ access_token: string; refresh_token: string }> {
    // Verificar refresh token
    try {
      verifyRefreshToken(refresh_token);
    } catch (error) {
      throw new ValidationError('Refresh token inválido');
    }

    // Verificar se token está no Redis
    if (!redis) {
      throw new Error('Redis não inicializado');
    }
    const storedToken = await redis.get(`refresh_token:${userId}`);

    if (storedToken !== refresh_token) {
      throw new ValidationError('Refresh token não encontrado ou expirou');
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado');
    }

    // Gerar novos tokens
    const new_access_token = signAccessToken(user.id, user.email, user.role as 'CLIENT' | 'ADMIN');
    const new_refresh_token = signRefreshToken(user.id);

    // Atualizar refresh token no Redis
    await redis.setex(
      `refresh_token:${user.id}`,
      REFRESH_TOKEN_TTL,
      new_refresh_token
    );

    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token,
    };
  },

  async logout(userId: string): Promise<void> {
    // Deletar refresh token do Redis
    if (!redis) {
      throw new Error('Redis não inicializado');
    }
    await redis.del(`refresh_token:${userId}`);
  },

  async deleteAccount(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Usuário não encontrado');

    const anonymizedEmail = `anonymized_${Date.now()}@deleted.com`;

    // 1. Apagar Informações Pessoais diretas ligadas do Prisma
    await prisma.userAddress.deleteMany({ where: { userId } });
    await prisma.userCard.deleteMany({ where: { userId } });

    // 2. Soft-delete the user
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: 'Usuário Anonimizado',
        email: anonymizedEmail,
        phone: null,
        deletedAt: new Date(),
        stripeCustomerId: null
      }
    });

    // 3. Anonimizar Logs no MongoDB para proteger dados da LGPD sem perder finança
    try {
      await OrderLog.updateMany(
        { user_id: userId },
        { 
          $unset: { address: 1, notes: 1 },
        }
      );
    } catch(e) {
      console.error('Erro ao limpar historico do MongoDB', e);
    }

    // 4. Logout do Redis
    if (redis) {
      await redis.del(`refresh_token:${userId}`);
    }
  },
};
