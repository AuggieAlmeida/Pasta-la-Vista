import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function seed(): Promise<void> {
  console.log('Iniciando seed de usuarios...');

  try {
    // Criar admin
    const adminPassword = await bcrypt.hash('Admin123!', SALT_ROUNDS);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@pastalavista.com' },
      update: {},
      create: {
        name: 'Admin Pasta la Vista',
        email: 'admin@pastalavista.com',
        passwordHash: adminPassword,
        role: 'ADMIN',
        phone: '+5511999990000',
      },
    });
    console.log(`Admin criado: ${admin.email} (${admin.id})`);

    // Criar cliente 1
    const client1Password = await bcrypt.hash('Cliente123!', SALT_ROUNDS);
    const client1 = await prisma.user.upsert({
      where: { email: 'cliente1@test.com' },
      update: {},
      create: {
        name: 'Maria Silva',
        email: 'cliente1@test.com',
        passwordHash: client1Password,
        role: 'CLIENT',
        phone: '+5511999991111',
      },
    });
    console.log(`Cliente 1 criado: ${client1.email} (${client1.id})`);

    // Criar cliente 2
    const client2Password = await bcrypt.hash('Cliente123!', SALT_ROUNDS);
    const client2 = await prisma.user.upsert({
      where: { email: 'cliente2@test.com' },
      update: {},
      create: {
        name: 'Joao Santos',
        email: 'cliente2@test.com',
        passwordHash: client2Password,
        role: 'CLIENT',
        phone: '+5511999992222',
      },
    });
    console.log(`Cliente 2 criado: ${client2.email} (${client2.id})`);

    console.log('Seed de usuarios concluido com sucesso!');
    console.log('');
    console.log('Credenciais de teste:');
    console.log('  Admin:    admin@pastalavista.com / Admin123!');
    console.log('  Cliente1: cliente1@test.com / Cliente123!');
    console.log('  Cliente2: cliente2@test.com / Cliente123!');
  } catch (error) {
    console.error('Erro no seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
