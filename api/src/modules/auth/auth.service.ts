import bcrypt from 'bcrypt';
import { prisma, redis } from '../../config/database';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { RegisterInput, LoginInput } from './auth.schema';

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
      throw new Error('Email já cadastrado');
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
    await redis!.setex(
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
      throw new Error('Credenciais inválidas');
    }

    // Validar senha
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas');
    }

    // Gerar tokens
    const access_token = signAccessToken(user.id, user.email, user.role as 'CLIENT' | 'ADMIN');
    const refresh_token = signRefreshToken(user.id);

    // Armazenar refresh token no Redis
    await redis!.setex(
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
      throw new Error('Refresh token inválido');
    }

    // Verificar se token está no Redis
    const storedToken = await redis!.get(`refresh_token:${userId}`);

    if (storedToken !== refresh_token) {
      throw new Error('Refresh token não encontrado ou expirou');
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Gerar novos tokens
    const new_access_token = signAccessToken(user.id, user.email, user.role as 'CLIENT' | 'ADMIN');
    const new_refresh_token = signRefreshToken(user.id);

    // Atualizar refresh token no Redis
    await redis!.setex(
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
    await redis!.del(`refresh_token:${userId}`);
  },
};
