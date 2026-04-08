import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import Redis from 'ioredis';

const prisma = new PrismaClient();
let mongodb: mongoose.Mongoose | null = null;
let redis: Redis | null = null;

export const connectDatabases = async (): Promise<void> => {
  try {
    // PostgreSQL via Prisma
    await prisma.$connect();
    console.log('✅ PostgreSQL (Prisma) conectado');

    // MongoDB via Mongoose
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI não configurado');

    mongodb = await mongoose.connect(mongoUri, {
      dbName: 'pastalavista_dev',
    });
    console.log('✅ MongoDB (Mongoose) conectado');

    // Redis via ioredis
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) throw new Error('REDIS_URL não configurado');

    redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: null,
    });

    redis.on('connect', () => {
      console.log('✅ Redis (Upstash) conectado');
    });

    redis.on('error', (err) => {
      console.error('❌ Erro Redis:', err);
    });

  } catch (error) {
    console.error('❌ Erro ao conectar bancos de dados:', error);
    process.exit(1);
  }
};

export const disconnectDatabases = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    if (mongodb) await mongoose.disconnect();
    if (redis) await redis.quit();
    console.log('✅ Todas as conexões fechadas');
  } catch (error) {
    console.error('❌ Erro ao desconectar:', error);
  }
};

export { prisma, mongodb, redis };
