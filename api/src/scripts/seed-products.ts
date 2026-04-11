import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Product } from '../modules/products/product.model';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedProduct {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  preparation_time: number;
  customizations: {
    type: string;
    name: string;
    price_modifier: number;
    available: boolean;
  }[];
}

const products: SeedProduct[] = [
  // Pizzas (5)
  {
    name: 'Pizza Margherita',
    description: 'Molho de tomate fresco, mussarela de bufala, manjericao e azeite extra virgem. Um classico italiano.',
    price: 42.90,
    image: '',
    category: 'pizzas',
    preparation_time: 25,
    customizations: [
      { type: 'size', name: 'Pequena (4 fatias)', price_modifier: 0, available: true },
      { type: 'size', name: 'Media (8 fatias)', price_modifier: 10, available: true },
      { type: 'size', name: 'Grande (12 fatias)', price_modifier: 20, available: true },
    ],
  },
  {
    name: 'Pizza Pepperoni',
    description: 'Molho de tomate, mussarela, pepperoni artesanal e oregano. Sabor intenso e marcante.',
    price: 48.90,
    image: '',
    category: 'pizzas',
    preparation_time: 25,
    customizations: [
      { type: 'size', name: 'Pequena (4 fatias)', price_modifier: 0, available: true },
      { type: 'size', name: 'Media (8 fatias)', price_modifier: 10, available: true },
      { type: 'size', name: 'Grande (12 fatias)', price_modifier: 20, available: true },
    ],
  },
  {
    name: 'Pizza Quattro Formaggi',
    description: 'Mussarela, gorgonzola, parmesao e provolone. Para os amantes de queijo.',
    price: 52.90,
    image: '',
    category: 'pizzas',
    preparation_time: 25,
    customizations: [
      { type: 'size', name: 'Pequena (4 fatias)', price_modifier: 0, available: true },
      { type: 'size', name: 'Media (8 fatias)', price_modifier: 12, available: true },
      { type: 'size', name: 'Grande (12 fatias)', price_modifier: 24, available: true },
    ],
  },
  {
    name: 'Pizza Capricciosa',
    description: 'Molho de tomate, mussarela, presunto, cogumelos, alcachofra e azeitonas.',
    price: 54.90,
    image: '',
    category: 'pizzas',
    preparation_time: 30,
    customizations: [
      { type: 'size', name: 'Pequena (4 fatias)', price_modifier: 0, available: true },
      { type: 'size', name: 'Media (8 fatias)', price_modifier: 12, available: true },
      { type: 'size', name: 'Grande (12 fatias)', price_modifier: 24, available: true },
    ],
  },
  {
    name: 'Pizza Diavola',
    description: 'Molho de tomate, mussarela, salame picante, pimenta calabresa e pimentao.',
    price: 49.90,
    image: '',
    category: 'pizzas',
    preparation_time: 25,
    customizations: [
      { type: 'size', name: 'Pequena (4 fatias)', price_modifier: 0, available: true },
      { type: 'size', name: 'Media (8 fatias)', price_modifier: 10, available: true },
      { type: 'size', name: 'Grande (12 fatias)', price_modifier: 20, available: true },
    ],
  },
  // Bebidas (3)
  {
    name: 'Limonada Siciliana',
    description: 'Limonada artesanal com limao siciliano, hortelã e agua com gas. Refrescante.',
    price: 14.90,
    image: '',
    category: 'bebidas',
    preparation_time: 5,
    customizations: [],
  },
  {
    name: 'Suco de Laranja Natural',
    description: 'Suco de laranja espremido na hora. 100% natural, sem acucar adicionado.',
    price: 12.90,
    image: '',
    category: 'bebidas',
    preparation_time: 5,
    customizations: [],
  },
  {
    name: 'Agua Mineral',
    description: 'Agua mineral natural 500ml. Com ou sem gas.',
    price: 5.90,
    image: '',
    category: 'bebidas',
    preparation_time: 1,
    customizations: [
      { type: 'ingredient', name: 'Com Gas', price_modifier: 0, available: true },
      { type: 'ingredient', name: 'Sem Gas', price_modifier: 0, available: true },
    ],
  },
  // Sobremesas (2)
  {
    name: 'Tiramisu',
    description: 'Classico tiramisu italiano com mascarpone, cafe espresso e cacau em po.',
    price: 22.90,
    image: '',
    category: 'sobremesas',
    preparation_time: 5,
    customizations: [],
  },
  {
    name: 'Panna Cotta',
    description: 'Panna cotta cremosa com calda de frutas vermelhas e folhas de hortela.',
    price: 19.90,
    image: '',
    category: 'sobremesas',
    preparation_time: 5,
    customizations: [],
  },
];

async function seedProducts(): Promise<void> {
  console.log('Iniciando seed de produtos...');

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI nao configurado');
  }

  try {
    await mongoose.connect(mongoUri, { dbName: 'pastalavista_dev' });
    console.log('MongoDB conectado');

    // Limpar produtos existentes
    await Product.deleteMany({});
    console.log('Produtos anteriores removidos');

    // Inserir novos produtos
    const createdProducts = await Product.insertMany(products);
    console.log(`${createdProducts.length} produtos inseridos no MongoDB`);

    // Criar stocks no PostgreSQL para cada produto
    for (const product of createdProducts) {
      await prisma.stock.upsert({
        where: { productId: product._id.toString() },
        update: { quantity: 50, minQuantity: 5, status: 'AVAILABLE' },
        create: {
          productId: product._id.toString(),
          quantity: 50,
          minQuantity: 5,
          status: 'AVAILABLE',
        },
      });
    }
    console.log(`Stocks criados no PostgreSQL para ${createdProducts.length} produtos`);

    console.log('');
    console.log('Produtos inseridos:');
    for (const p of createdProducts) {
      console.log(`  [${p.category}] ${p.name} - R$ ${p.price.toFixed(2)} (ID: ${p._id})`);
    }

    console.log('');
    console.log('Seed de produtos concluido com sucesso!');
  } catch (error) {
    console.error('Erro no seed de produtos:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
  }
}

seedProducts();
