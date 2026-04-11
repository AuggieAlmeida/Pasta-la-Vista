import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import Redis from 'ioredis';

const prisma = new PrismaClient();
let mongodb: mongoose.Mongoose | null = null;
let redis: Redis | null = null;

/**
 * Wait for Redis to be ready with exponential backoff retry
 */
const waitForRedisReady = (
  redisClient: Redis,
  maxRetries: number = 5,
  timeout: number = 30000
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let retries = 0;

    const checkConnection = () => {
      if (redisClient.status === 'ready') {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(
          new Error(
            `Redis connection timeout after ${timeout}ms. Status: ${redisClient.status}`
          )
        );
        return;
      }

      retries++;
      if (retries > maxRetries) {
        reject(
          new Error(
            `Redis connection failed after ${maxRetries} retries. Status: ${redisClient.status}`
          )
        );
        return;
      }

      const delay = Math.min(Math.pow(2, retries) * 100, 2000);
      setTimeout(checkConnection, delay);
    };

    checkConnection();
  });
};

export const connectDatabases = async (): Promise<void> => {
  try {
    // PostgreSQL via Prisma
    await prisma.$connect();
    console.log('PostgreSQL (Prisma) conectado');

    // MongoDB via Mongoose
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI não configurado');

    mongodb = await mongoose.connect(mongoUri, {
      dbName: 'pastalavista_dev',
    });
    console.log('MongoDB (Mongoose) conectado');

    // Redis via ioredis
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) throw new Error('REDIS_URL não configurado');

    redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: null,
      connectTimeout: 5000,
      enableReadyCheck: true,
    });

    redis.on('connect', () => {
      console.log('Redis conectado');
    });

    redis.on('ready', () => {
      console.log('Redis (ioredis) pronto');
    });

    redis.on('error', (err) => {
      console.error('Erro Redis:', err.message);
    });

    // Wait for Redis to be ready
    await waitForRedisReady(redis, 5, 30000);

  } catch (error) {
    console.error('Erro ao conectar bancos de dados:', error);
    process.exit(1);
  }
};

export const disconnectDatabases = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    if (mongodb) await mongoose.disconnect();
    if (redis) await redis.quit();
    console.log('Todas as conexões fechadas');
  } catch (error) {
    console.error('Erro ao desconectar:', error);
  }
};

export { prisma, mongodb, redis };
