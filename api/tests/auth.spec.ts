import request from 'supertest';
import app from '../src/app';
import { prisma, redis, connectDatabases, disconnectDatabases } from '../src/config/database';
import bcrypt from 'bcrypt';

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    // Initialize databases (including Redis)
    await connectDatabases();

    // Wait a bit for Redis to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Limpar dados dos bancos antes dos testes
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.stock.deleteMany();
    await prisma.user.deleteMany();

    // Clear Redis cache
    if (redis) {
      try {
        await redis.flushdb();
      } catch (error) {
        console.error('Erro ao limpar Redis:', error);
      }
    }
  }, 30000);

  afterAll(async () => {
    // Limpar e desconectar
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.stock.deleteMany();
    await prisma.user.deleteMany();

    // Clear Redis cache
    if (redis) {
      try {
        await redis.flushdb();
      } catch (error) {
        console.error('Erro ao limpar Redis:', error);
      }
    }

    // Disconnect all databases
    await disconnectDatabases();
  });

  describe('POST /api/v1/auth/register', () => {
    it('deve registrar um novo usuário com dados válidos', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'João Silva',
          email: 'joao@example.com',
          password: 'Password123',
          phone: '+55 11 99999-9999',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe('joao@example.com');
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.refresh_token).toBeDefined();
    });

    it('deve rejeitar registro com email duplicado', async () => {
      // Primeiro usuário
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Maria Silva',
          email: 'maria@example.com',
          password: 'Password123',
        });

      // Segundo com mesmo email
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Maria Oliveira',
          email: 'maria@example.com',
          password: 'Password456',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('deve rejeitar senha fraca', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Pedro Santos',
          email: 'pedro@example.com',
          password: 'weak',
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('deve rejeitar email inválido', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Ana Costa',
          email: 'invalid-email',
          password: 'Password123',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeAll(async () => {
      // Criar usuário para testes de login
      const passwordHash = await bcrypt.hash('Password123', 10);
      await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          passwordHash,
          role: 'CLIENT',
        },
      });
    });

    it('deve fazer login com credenciais corretas', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.refresh_token).toBeDefined();
    });

    it('deve rejeitar credenciais incorretas', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('deve rejeitar usuário inexistente', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      // Fazer login para obter tokens
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      accessToken = res.body.data.access_token;
      refreshToken = res.body.data.refresh_token;
    });

    it('deve emitir novo access token com refresh token válido', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refresh_token: refreshToken,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.refresh_token).toBeDefined();
      // Novos tokens devem ser diferentes
      expect(res.body.data.access_token).not.toBe(accessToken);
    });

    it('deve rejeitar refresh token inválido', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refresh_token: 'invalid-token',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      accessToken = res.body.data.access_token;
    });

    it('deve fazer logout com token válido', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });

    it('deve rejeitar logout sem token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout');

      expect(res.status).toBe(401);
    });
  });

  describe('Health Check', () => {
    it('deve retornar status ok', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
