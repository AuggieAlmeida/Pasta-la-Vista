import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Product } from '../src/modules/products/product.model';
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

const SIZE_CUSTOMIZATIONS = [
  { type: 'size', name: 'Pequena (4 fatias)', price_modifier: 0, available: true },
  { type: 'size', name: 'Media (8 fatias)', price_modifier: 10, available: true },
  { type: 'size', name: 'Grande (12 fatias)', price_modifier: 20, available: true },
];

const SIZE_CUSTOMIZATIONS_PREMIUM = [
  { type: 'size', name: 'Pequena (4 fatias)', price_modifier: 0, available: true },
  { type: 'size', name: 'Media (8 fatias)', price_modifier: 12, available: true },
  { type: 'size', name: 'Grande (12 fatias)', price_modifier: 24, available: true },
];

const PASTA_CUSTOMIZATIONS = [
  { type: 'ingredient', name: 'Ralar Trufas Negras', price_modifier: 25, available: true },
  { type: 'ingredient', name: 'Queijo Parmesao Parmigiano-Reggiano Extra', price_modifier: 8, available: true },
];

const products: SeedProduct[] = [
  // ─── Pizzas (8) ───────────────────────────────────────────
  {
    name: 'Pizza Margherita',
    description: 'Molho de tomate fresco, mussarela de bufala, manjericao e azeite extra virgem. Um classico italiano.',
    price: 42.90,
    image: '',
    category: 'pizzas',
    preparation_time: 25,
    customizations: SIZE_CUSTOMIZATIONS,
  },
  {
    name: 'Pizza Pepperoni',
    description: 'Molho de tomate, mussarela, pepperoni artesanal e oregano. Sabor intenso e marcante.',
    price: 48.90,
    image: '',
    category: 'pizzas',
    preparation_time: 25,
    customizations: SIZE_CUSTOMIZATIONS,
  },
  {
    name: 'Pizza Quattro Formaggi',
    description: 'Mussarela, gorgonzola, parmesao e provolone. Para os amantes de queijo.',
    price: 52.90,
    image: '',
    category: 'pizzas',
    preparation_time: 25,
    customizations: SIZE_CUSTOMIZATIONS_PREMIUM,
  },
  {
    name: 'Pizza Capricciosa',
    description: 'Molho de tomate, mussarela, presunto, cogumelos, alcachofra e azeitonas.',
    price: 54.90,
    image: '',
    category: 'pizzas',
    preparation_time: 30,
    customizations: SIZE_CUSTOMIZATIONS_PREMIUM,
  },
  {
    name: 'Pizza Diavola',
    description: 'Molho de tomate, mussarela, salame picante, pimenta calabresa e pimentao.',
    price: 49.90,
    image: '',
    category: 'pizzas',
    preparation_time: 25,
    customizations: SIZE_CUSTOMIZATIONS,
  },
  {
    name: 'Pizza Napoletana',
    description: 'Molho San Marzano, mussarela, anchovas, alcaparras e azeitonas pretas. Tradicao de Napoli.',
    price: 53.90,
    image: '',
    category: 'pizzas',
    preparation_time: 25,
    customizations: SIZE_CUSTOMIZATIONS_PREMIUM,
  },
  {
    name: 'Pizza Funghi',
    description: 'Creme de cogumelos, mussarela, cogumelos Paris, shiitake e trufas em oleo. Sofisticada e aromatica.',
    price: 57.90,
    image: '',
    category: 'pizzas',
    preparation_time: 30,
    customizations: SIZE_CUSTOMIZATIONS_PREMIUM,
  },
  {
    name: 'Pizza Frango com Catupiry',
    description: 'Frango desfiado temperado, catupiry original, mussarela e milho verde. A favorita do Brasil.',
    price: 50.90,
    image: '',
    category: 'pizzas',
    preparation_time: 25,
    customizations: SIZE_CUSTOMIZATIONS,
  },

  // ─── Massas (6) ───────────────────────────────────────────
  {
    name: 'Carbonara',
    description: 'Massa al dente com guanciale, gema de ovo, pecorino romano e pimenta-do-reino moida na hora.',
    price: 46.90,
    image: '',
    category: 'massas',
    preparation_time: 20,
    customizations: PASTA_CUSTOMIZATIONS,
  },
  {
    name: 'Bolognese',
    description: 'Ragu de carne bovina e suina cozido lentamente com tomates San Marzano e vinho tinto. Classico.',
    price: 44.90,
    image: '',
    category: 'massas',
    preparation_time: 20,
    customizations: PASTA_CUSTOMIZATIONS,
  },
  {
    name: 'Cacio e Pepe',
    description: 'Massa com creme de pecorino, parmesao e pimenta-do-reino. Simplicidade e sabor em perfeita harmonia.',
    price: 39.90,
    image: '',
    category: 'massas',
    preparation_time: 15,
    customizations: PASTA_CUSTOMIZATIONS,
  },
  {
    name: 'Arrabiata',
    description: 'Molho de tomate com pimenta calabresa, alho e azeite. Picante e vigoroso, tipico romano.',
    price: 38.90,
    image: '',
    category: 'massas',
    preparation_time: 15,
    customizations: PASTA_CUSTOMIZATIONS,
  },
  {
    name: 'Pesto alla Genovese',
    description: 'Pesto fresco de manjericao, pinholi, alho, parmesao e azeite extra virgem. Elegante e aromatico.',
    price: 43.90,
    image: '',
    category: 'massas',
    preparation_time: 15,
    customizations: PASTA_CUSTOMIZATIONS,
  },
  {
    name: 'Frutos do Mar',
    description: 'Camarao, lula, mexilhao e vongole em molho de tomate fresco com vinho branco e ervas.',
    price: 64.90,
    image: '',
    category: 'massas',
    preparation_time: 25,
    customizations: PASTA_CUSTOMIZATIONS,
  },

  // ─── Entradas (5) ─────────────────────────────────────────
  {
    name: 'Bruschetta al Pomodoro',
    description: 'Fatias de pao rústico grelhado, tomate temperado, alho, manjericao e azeite. Porcao com 4 unidades.',
    price: 24.90,
    image: '',
    category: 'entradas',
    preparation_time: 10,
    customizations: [],
  },
  {
    name: 'Carpaccio di Manzo',
    description: 'Fatias finas de file mignon cru, rúcula, lascas de parmesao e molho de alcaparras e mostarda.',
    price: 38.90,
    image: '',
    category: 'entradas',
    preparation_time: 10,
    customizations: [],
  },
  {
    name: 'Burrata com Presunto Cru',
    description: 'Burrata cremosa, presunto de Parma, tomate cereja, rúcula e azeite temperado. Pura indulgencia.',
    price: 44.90,
    image: '',
    category: 'entradas',
    preparation_time: 8,
    customizations: [],
  },
  {
    name: 'Arancini',
    description: 'Bolinhos de arroz arborio recheados com ragu e mussarela, empanados e fritos. 4 unidades.',
    price: 28.90,
    image: '',
    category: 'entradas',
    preparation_time: 15,
    customizations: [
      { type: 'variation', name: 'Ragu de Carne', price_modifier: 0, available: true },
      { type: 'variation', name: 'Funghi e Mussarela', price_modifier: 2, available: true },
    ],
  },
  {
    name: 'Caponata Siciliana',
    description: 'Berinjela, aipo, tomate, azeitonas e alcaparras refogados em agridoce. Servida com crostini.',
    price: 26.90,
    image: '',
    category: 'entradas',
    preparation_time: 10,
    customizations: [],
  },

  // ─── Saladas (3) ──────────────────────────────────────────
  {
    name: 'Insalata Caprese',
    description: 'Tomate italiano, mussarela de bufala, manjericao fresco e azeite extra virgem. Classico e refrescante.',
    price: 32.90,
    image: '',
    category: 'saladas',
    preparation_time: 8,
    customizations: [],
  },
  {
    name: 'Insalata di Rucola',
    description: 'Rúcula fresca, tomates cereja, parmesao em lascas, nozes e molho de mel com mostarda.',
    price: 28.90,
    image: '',
    category: 'saladas',
    preparation_time: 8,
    customizations: [],
  },
  {
    name: 'Panzanella',
    description: 'Salada toscana com pao rústico, tomate, pepino, cebola roxa, manjericao e vinagrete de vinho tinto.',
    price: 27.90,
    image: '',
    category: 'saladas',
    preparation_time: 10,
    customizations: [],
  },

  // ─── Sobremesas (5) ───────────────────────────────────────
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
  {
    name: 'Cannoli Siciliani',
    description: 'Casquinha crocante de massa frita recheada com creme de ricota, pistache e laranja cristalizada. 2 unidades.',
    price: 21.90,
    image: '',
    category: 'sobremesas',
    preparation_time: 5,
    customizations: [],
  },
  {
    name: 'Gelato Artesanal',
    description: 'Sorvete italiano artesanal feito diariamente. Escolha 2 sabores: pistache, baunilha, chocolate amargo ou limao siciliano.',
    price: 18.90,
    image: '',
    category: 'sobremesas',
    preparation_time: 3,
    customizations: [
      { type: 'variation', name: 'Pistache', price_modifier: 0, available: true },
      { type: 'variation', name: 'Baunilha', price_modifier: 0, available: true },
      { type: 'variation', name: 'Chocolate Amargo', price_modifier: 0, available: true },
      { type: 'variation', name: 'Limao Siciliano', price_modifier: 0, available: true },
    ],
  },
  {
    name: 'Torta della Nonna',
    description: 'Torta italiana com creme de confeiteiro, pinholi e limao. Receita tradicional da vovo toscana.',
    price: 24.90,
    image: '',
    category: 'sobremesas',
    preparation_time: 5,
    customizations: [],
  },

  // ─── Bebidas (7) ──────────────────────────────────────────
  {
    name: 'Limonada Siciliana',
    description: 'Limonada artesanal com limao siciliano, hortela e agua com gas. Refrescante.',
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
      { type: 'variation', name: 'Com Gas', price_modifier: 0, available: true },
      { type: 'variation', name: 'Sem Gas', price_modifier: 0, available: true },
    ],
  },
  {
    name: 'Cafe Espresso',
    description: 'Espresso italiano extraido de blend especial de graos torrados. Servido em xicara pre-aquecida.',
    price: 8.90,
    image: '',
    category: 'bebidas',
    preparation_time: 3,
    customizations: [
      { type: 'size', name: 'Simples', price_modifier: 0, available: true },
      { type: 'size', name: 'Duplo', price_modifier: 4, available: true },
    ],
  },
  {
    name: 'Cappuccino',
    description: 'Espresso com leite vaporizado e espuma cremosa. Opcionalmente polvilhado com cacau ou canela.',
    price: 12.90,
    image: '',
    category: 'bebidas',
    preparation_time: 5,
    customizations: [
      { type: 'ingredient', name: 'Cacau', price_modifier: 0, available: true },
      { type: 'ingredient', name: 'Canela', price_modifier: 0, available: true },
    ],
  },
  {
    name: 'Vinho Tinto da Casa',
    description: 'Taca de vinho tinto selecionado pelo sommelier. Harmoniza perfeitamente com pizzas e massas.',
    price: 28.90,
    image: '',
    category: 'bebidas',
    preparation_time: 2,
    customizations: [
      { type: 'size', name: 'Taca (150ml)', price_modifier: 0, available: true },
      { type: 'size', name: 'Meia Garrafa (375ml)', price_modifier: 42, available: true },
      { type: 'size', name: 'Garrafa (750ml)', price_modifier: 70, available: true },
    ],
  },
  {
    name: 'Vinho Branco da Casa',
    description: 'Taca de vinho branco seco e elegante. Ideal com frutos do mar, saladas e entradas leves.',
    price: 26.90,
    image: '',
    category: 'bebidas',
    preparation_time: 2,
    customizations: [
      { type: 'size', name: 'Taca (150ml)', price_modifier: 0, available: true },
      { type: 'size', name: 'Meia Garrafa (375ml)', price_modifier: 38, available: true },
      { type: 'size', name: 'Garrafa (750ml)', price_modifier: 64, available: true },
    ],
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

    // Limpar stocks orfãos no PostgreSQL
    await prisma.stock.deleteMany({});
    console.log('Estoque anterior limpo');

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
