# ARCHITECTURE.md — Pasta la vista 

> Documento de arquitetura técnica do aplicativo móvel **Pasta la vista**, um sistema de pedidos de restaurante com perfis de Cliente e Administrador.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Estrutura de Pastas](#4-estrutura-de-pastas)
5. [Modelos de Dados](#5-modelos-de-dados)
6. [Design da API](#6-design-da-api)
7. [Fluxo de Autenticação](#7-fluxo-de-autenticação)
8. [Arquitetura de Navegação](#8-arquitetura-de-navegação)
9. [Gerenciamento de Estado](#9-gerenciamento-de-estado)
10. [Fluxo de Pagamento](#10-fluxo-de-pagamento)
11. [Estratégia de Cache](#11-estratégia-de-cache)
12. [Armazenamento de Arquivos](#12-armazenamento-de-arquivos)
13. [Pipeline CI/CD](#13-pipeline-cicd)
14. [Variáveis de Ambiente](#14-variáveis-de-ambiente)
15. [Definição de Pronto](#15-definição-de-pronto)
16. [Roadmap de Funcionalidades](#16-roadmap-de-funcionalidades)

---

## 1. Visão Geral

### Resumo do Projeto

O **Pasta la vista** é um aplicativo móvel multiplataforma (Android-first) que permite que clientes naveguem pelo cardápio, realizem pedidos e efetuem pagamentos via Stripe, enquanto administradores gerenciam produtos, estoque e o status dos pedidos em tempo real.

| Atributo          | Detalhe                                      |
|-------------------|----------------------------------------------|
| **Tipo**          | App mobile único com dois perfis de usuário  |
| **Equipe**        | 5 pessoas                                    |
| **Duração**       | 3 semanas (3 sprints de 1 semana cada)       |
| **Metodologia**   | SCRUM com Trello                             |
| **Repositório**   | Monorepo GitHub (`/api` + `/mobile`)         |

### Objetivos

- Oferecer uma experiência de pedido fluida e responsiva para clientes.
- Fornecer painel administrativo completo para gestão de cardápio e estoque.
- Garantir segurança transacional com pagamentos via Stripe e confirmação por webhook.
- Alcançar alta disponibilidade com cache Redis e CDN Cloudflare.

### Restrições e Decisões de Design

- **App único com navegação condicional** baseada no campo `role` do JWT (`client` | `admin`).
- **Persistência poliglota**: PostgreSQL para dados transacionais, MongoDB para esquema flexível do cardápio, Redis para cache e sessões.
- **Confirmação de pedido via webhook Stripe** — sem atualizações otimistas no lado do cliente.
- **Bloqueio automático de item** quando `stock.quantity === 0` no servidor.
- **Todas as imagens** servidas via CDN Cloudflare R2 com TTL de cache longo.

---

## 2. Arquitetura do Sistema

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DISPOSITIVO MÓVEL                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │               React Native App (Expo SDK 51+)                    │   │
│  │                                                                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │ React Nav v7 │  │  Zustand 5   │  │  TanStack Query v5   │  │   │
│  │  │ Stack/Tabs/  │  │  auth store  │  │  server state cache  │  │   │
│  │  │ Drawer       │  │  cart store  │  │  menu / orders       │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │  React Hook  │  │ Stripe RN    │  │ Axios + Interceptor  │  │   │
│  │  │  Form 7      │  │ SDK          │  │ (JWT Bearer Token)   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ HTTPS / REST
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    RAILWAY — API (Node.js 22 + Express 5)               │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  Auth Router │  │  Menu Router │  │ Order Router │  │ Stock     │  │
│  │  JWT/bcrypt  │  │  + Cache     │  │  + Stripe    │  │ Router    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Middleware: Auth Guard · Rate Limit · Zod           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────────────┐   │
│  │ Prisma ORM    │  │ Mongoose ODM  │  │ ioredis Client           │   │
│  └───────┬───────┘  └───────┬───────┘  └────────────┬─────────────┘   │
└──────────┼──────────────────┼───────────────────────┼──────────────────┘
           │                  │                        │
     ┌─────▼──────┐   ┌───────▼──────┐      ┌─────────▼────────┐
     │ PostgreSQL │   │  MongoDB     │      │  Redis           │
     │ (Railway / │   │  Atlas       │      │  (Upstash)       │
     │  Supabase) │   │  Free Tier   │      │  TTL 5min        │
     └────────────┘   └─────────────┘      └──────────────────┘

           Imagens
           ┌──────────────────────────────────────────┐
           │  Cloudflare R2 (Storage) + CDN (Delivery) │
           └──────────────────────────────────────────┘

           Pagamentos
           ┌──────────────────────┐
           │  Stripe API + Webhooks│
           └──────────────────────┘
```

---

## 3. Stack Tecnológica

### 3.1 Frontend Mobile

| Camada              | Tecnologia                        | Versão  | Finalidade                                  |
|---------------------|-----------------------------------|---------|---------------------------------------------|
| Framework           | Expo (Bare Workflow)              | SDK 51+ | Base do app (acesso nativo completo)        |
| Linguagem           | TypeScript                        | 5.x     | Tipagem estática                            |
| Navegação           | React Navigation                  | v7      | Stack + Bottom Tabs + Drawer                |
| Estado Global       | Zustand                           | 5.x     | Carrinho e autenticação                     |
| Cache de Servidor   | TanStack Query                    | v5      | Sincronização e cache de dados remotos      |
| Formulários         | React Hook Form                   | 7.x     | Validação de formulários                    |
| HTTP Client         | Axios                             | 1.x     | Requisições HTTP + interceptors             |
| Pagamento           | Stripe React Native SDK           | latest  | Coleta de dados de cartão                   |
| Armazenamento Local | MMKV / expo-secure-store           | latest  | JWT persistido com segurança                |
| UI Lista            | DraggableFlatList                 | latest  | Kanban de estoque (Admin)                   |

### 3.2 Backend / API

| Camada              | Tecnologia                        | Versão  | Finalidade                                  |
|---------------------|-----------------------------------|---------|---------------------------------------------|
| Runtime             | Node.js                           | 22 LTS  | Ambiente de execução                        |
| Framework           | Express                           | 5.x     | Roteamento e middleware                     |
| Linguagem           | TypeScript                        | 5.x     | Tipagem estática                            |
| Autenticação        | jsonwebtoken + bcrypt             | 9.x / 5.x| JWT e hash de senha                      |
| ORM Relacional      | Prisma                            | 5.x     | PostgreSQL                                  |
| ODM Documentos      | Mongoose                          | 8.x     | MongoDB                                     |
| Cache               | ioredis                           | 5.x     | Client Redis                                |
| Validação           | Zod                               | 3.x     | Validação de inputs da API                  |
| Pagamento           | Stripe Node SDK                   | latest  | Checkout e webhooks                         |
| Docs               | swagger-ui-express                | latest  | Documentação OpenAPI                        |
| Rate Limiting       | express-rate-limit                | latest  | Proteção contra abuso                       |

### 3.3 Bancos de Dados

| Banco        | Provedor              | Dados Armazenados                                    |
|--------------|-----------------------|------------------------------------------------------|
| PostgreSQL 16| Railway / Supabase    | Usuários, pedidos, itens de pedido, estoque, pagamentos |
| MongoDB 7    | Atlas (Free Tier)     | Produtos/cardápio (schema flexível), logs de pedidos |
| Redis        | Upstash (Free Tier)   | Cache do cardápio (TTL 5min), sessões JWT, contadores|

### 3.4 Infraestrutura

| Serviço      | Provedor          | Finalidade                                   |
|--------------|-------------------|----------------------------------------------|
| Hospedagem   | Railway           | API Node.js                                  |
| Storage      | Cloudflare R2     | Imagens de produtos (10 GB gratuito)         |
| CDN          | Cloudflare        | Entrega de imagens com cache                 |
| CI/CD        | GitHub Actions    | Build, lint e deploy automatizado            |
| Repositório  | GitHub Monorepo   | `/api` + `/mobile` no mesmo repositório      |

---

## 4. Estrutura de Pastas

```
pasta-la-vista/                          # Raiz do monorepo
├── .github/
│   └── workflows/
│       ├── api-ci.yml                  # CI da API (lint, test, build)
│       └── mobile-ci.yml              # CI Mobile (lint, type-check)
├── api/                               # Backend Node.js + Express
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts            # Conexões Prisma + Mongoose + Redis
│   │   │   └── env.ts                 # Validação de variáveis de ambiente (Zod)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts     # Verificação e decode do JWT
│   │   │   ├── role.middleware.ts     # Guard de role (admin | client)
│   │   │   ├── validate.middleware.ts # Validação de body com Zod
│   │   │   └── rateLimit.middleware.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.schema.ts     # Schemas Zod
│   │   │   ├── menu/
│   │   │   │   ├── menu.controller.ts
│   │   │   │   ├── menu.service.ts    # Lógica de cache Redis
│   │   │   │   └── product.model.ts  # Mongoose schema
│   │   │   ├── orders/
│   │   │   │   ├── order.controller.ts
│   │   │   │   └── order.service.ts
│   │   │   ├── stock/
│   │   │   │   ├── stock.controller.ts
│   │   │   │   └── stock.service.ts
│   │   │   └── payment/
│   │   │       ├── payment.controller.ts
│   │   │       └── stripe.service.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Schema PostgreSQL
│   │   │   └── migrations/
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   ├── r2.ts                  # Upload Cloudflare R2
│   │   │   └── logger.ts
│   │   └── app.ts                     # Entry point Express
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── mobile/                            # Expo Bare Workflow App
    ├── src/
    │   ├── api/
    │   │   ├── axios.ts               # Instância Axios + interceptors
    │   │   └── endpoints/
    │   │       ├── auth.api.ts
    │   │       ├── menu.api.ts
    │   │       ├── orders.api.ts
    │   │       └── payment.api.ts
    │   ├── stores/
    │   │   ├── auth.store.ts          # Zustand: token, user, role
    │   │   └── cart.store.ts          # Zustand: itens do carrinho
    │   ├── hooks/
    │   │   ├── useMenu.ts             # TanStack Query: GET /api/menu
    │   │   ├── useOrders.ts
    │   │   └── useStock.ts
    │   ├── navigation/
    │   │   ├── RootNavigator.tsx      # Roteamento baseado em role
    │   │   ├── ClientNavigator.tsx    # Bottom Tabs + Stack
    │   │   └── AdminNavigator.tsx     # Drawer + Stack
    │   ├── screens/
    │   │   ├── client/
    │   │   │   ├── SplashScreen.tsx
    │   │   │   ├── LoginScreen.tsx
    │   │   │   ├── RegisterScreen.tsx
    │   │   │   ├── HomeScreen.tsx
    │   │   │   ├── ItemDetailScreen.tsx
    │   │   │   ├── CartScreen.tsx
    │   │   │   ├── PaymentScreen.tsx
    │   │   │   └── OrderHistoryScreen.tsx
    │   │   └── admin/
    │   │       ├── DashboardScreen.tsx
    │   │       ├── ProductListScreen.tsx
    │   │       ├── ProductFormScreen.tsx
    │   │       └── StockKanbanScreen.tsx
    │   ├── components/
    │   │   ├── common/
    │   │   └── admin/
    │   ├── theme/
    │   │   └── index.ts               # Cores, tipografia, espaçamentos
    │   └── types/
    │       └── index.ts               # Tipos globais e DTOs
    ├── app.json                       # Configuração Expo (nome, slug, ícone)
    ├── app.config.ts                  # Config dinâmica (variáveis de ambiente)
    ├── eas.json                       # Perfis de build EAS (dev/preview/prod)
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    └── babel.config.js                # babel-preset-expo
```

---

## 5. Modelos de Dados

### 5.1 PostgreSQL (Prisma Schema)

```prisma
// prisma/schema.prisma

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String   @map("password_hash")
  role         Role     @default(CLIENT)
  phone        String?
  createdAt    DateTime @default(now()) @map("created_at")

  orders       Order[]
}

enum Role {
  CLIENT
  ADMIN
}

model Order {
  id            String      @id @default(uuid())
  userId        String      @map("user_id")
  total         Decimal     @db.Decimal(10, 2)
  status        OrderStatus @default(PENDING)
  paymentMethod String      @map("payment_method")
  paidAt        DateTime?   @map("paid_at")
  createdAt     DateTime    @default(now()) @map("created_at")

  user          User        @relation(fields: [userId], references: [id])
  items         OrderItem[]
  payment       Payment?
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY
  DELIVERED
  CANCELLED
}

model OrderItem {
  id          String  @id @default(uuid())
  orderId     String  @map("order_id")
  productId   String  @map("product_id")  // Referência ao _id do MongoDB
  quantity    Int
  unitPrice   Decimal @db.Decimal(10, 2) @map("unit_price")
  obs         String?

  order       Order   @relation(fields: [orderId], references: [id])
}

model Stock {
  id          String      @id @default(uuid())
  productId   String      @unique @map("product_id") // Ref MongoDB
  quantity    Int
  minQuantity Int         @map("min_quantity")
  status      StockStatus @default(AVAILABLE)

  @@index([status])
}

enum StockStatus {
  AVAILABLE
  LOW
  OUT_OF_STOCK
}

model Payment {
  id              String  @id @default(uuid())
  orderId         String  @unique @map("order_id")
  stripePaymentId String  @map("stripe_payment_id")
  status          String
  amount          Decimal @db.Decimal(10, 2)

  order           Order   @relation(fields: [orderId], references: [id])
}
```

### 5.2 MongoDB (Mongoose Schemas)

```typescript
// modules/menu/product.model.ts

const CustomizationSchema = new Schema({
  label:    { type: String, required: true },  // ex: "Tamanho"
  options:  [{ type: String }],                // ex: ["P", "M", "G"]
});

const ProductSchema = new Schema({
  name:           { type: String, required: true, index: true },
  description:    { type: String },
  price:          { type: Number, required: true },
  category:       { type: String, required: true, index: true },
  imageUrl:       { type: String },            // URL Cloudflare R2 via CDN
  tags:           [{ type: String }],
  customizations: [CustomizationSchema],
  active:         { type: Boolean, default: true, index: true },
}, { timestamps: true });

// Collection: products

const StatusHistorySchema = new Schema({
  status:    { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: String },               // userId
});

const OrderLogSchema = new Schema({
  orderId:       { type: String, required: true, index: true }, // ref PostgreSQL
  userId:        { type: String, required: true },
  snapshotItems: [{ productId: String, name: String, quantity: Number, unitPrice: Number }],
  total:         { type: Number },
  statusHistory: [StatusHistorySchema],
}, { timestamps: true });

// Collection: order_logs
```

### 5.3 Relacionamentos entre Bancos

```
PostgreSQL.Order.id  ────────────► MongoDB.order_logs.orderId  (log imutável)
PostgreSQL.OrderItem.productId ──► MongoDB.products._id         (referência cross-DB)
PostgreSQL.Stock.productId ──────► MongoDB.products._id         (controle de estoque)
```

---

## 6. Design da API

> Base URL: `https://api.pastalavista.com.br/api`
> Autenticação: `Authorization: Bearer <access_token>` (exceto rotas públicas)

### 6.1 Autenticação

| Método | Rota                   | Auth | Descrição                                   |
|--------|------------------------|------|---------------------------------------------|
| POST   | `/auth/register`       | ❌   | Cadastro de novo usuário (role: client)     |
| POST   | `/auth/login`          | ❌   | Login e emissão de tokens JWT               |
| POST   | `/auth/refresh`        | ❌   | Renovação do access token via refresh token |

### 6.2 Cardápio (Menu)

| Método | Rota                            | Auth    | Descrição                                    |
|--------|---------------------------------|---------|----------------------------------------------|
| GET    | `/menu`                         | ❌      | Lista todos os produtos ativos (com cache)   |
| GET    | `/menu/:id`                     | ❌      | Detalhe de um produto                        |
| GET    | `/menu/categoria/:nome`         | ❌      | Filtra produtos por categoria                |
| POST   | `/admin/produtos`               | 🔐 Admin| Cria novo produto                           |
| PATCH  | `/admin/produtos/:id`           | 🔐 Admin| Edita produto existente                     |
| DELETE | `/admin/produtos/:id`           | 🔐 Admin| Desativa produto (soft delete)              |
| POST   | `/admin/produtos/:id/imagem`    | 🔐 Admin| Upload de imagem para R2                    |

### 6.3 Pedidos

| Método | Rota                    | Auth      | Descrição                                   |
|--------|-------------------------|-----------|---------------------------------------------|
| POST   | `/pedidos`              | 🔐 Client | Cria novo pedido                            |
| GET    | `/pedidos/meus`         | 🔐 Client | Lista pedidos do usuário autenticado        |
| GET    | `/pedidos/:id`          | 🔐 Client | Detalhe de um pedido                        |
| GET    | `/admin/pedidos`        | 🔐 Admin  | Lista todos os pedidos                      |
| PATCH  | `/admin/pedidos/:id`    | 🔐 Admin  | Atualiza status do pedido                   |

### 6.4 Estoque

| Método | Rota                        | Auth     | Descrição                                  |
|--------|-----------------------------|----------|--------------------------------------------|
| GET    | `/admin/estoque`            | 🔐 Admin | Lista todos os itens de estoque            |
| PATCH  | `/admin/estoque/:id`        | 🔐 Admin | Atualiza quantidade de um item             |
| GET    | `/admin/estoque/alertas`    | 🔐 Admin | Lista itens com status LOW ou OUT_OF_STOCK |

### 6.5 Pagamento

| Método | Rota                    | Auth      | Descrição                                         |
|--------|-------------------------|-----------|---------------------------------------------------|
| POST   | `/pagamento/checkout`   | 🔐 Client | Cria PaymentIntent no Stripe e retorna client_key |
| POST   | `/pagamento/webhook`    | ❌ (Stripe)| Recebe eventos do Stripe e confirma pedido       |

---

## 7. Fluxo de Autenticação

### 7.1 Diagrama Mermaid

```mermaid
sequenceDiagram
    participant App as React Native App
    participant Store as Zustand Auth Store
    participant Axios as Axios Interceptor
    participant API as Express API
    participant Redis as Redis (Sessões)
    participant DB as PostgreSQL

    Note over App,DB: Fluxo de Login
    App->>API: POST /auth/login { email, password }
    API->>DB: Busca usuário por email
    DB-->>API: user { id, passwordHash, role }
    API->>API: bcrypt.compare(password, hash)
    API->>API: jwt.sign({ sub: id, role }) → access_token (15min)
    API->>API: jwt.sign({ sub: id }) → refresh_token (7d)
    API->>Redis: SET session:{userId} refresh_token EX 604800
    API-->>App: { access_token, refresh_token, user }
    App->>Store: setAuth({ token, user, role })
    Store->>Store: MMKV.set('access_token', token)

    Note over App,DB: Requisição Autenticada
    App->>Axios: Qualquer requisição protegida
    Axios->>Axios: Injeta Bearer token no header
    Axios->>API: GET /pedidos/meus (Authorization: Bearer <token>)
    API->>API: jwt.verify(token, JWT_SECRET)
    API->>API: role check (se rota admin)
    API-->>App: Dados da requisição

    Note over App,DB: Refresh de Token (token expirado)
    Axios->>API: Requisição com token expirado → 401
    API-->>Axios: 401 Unauthorized
    Axios->>API: POST /auth/refresh { refresh_token }
    API->>Redis: GET session:{userId}
    Redis-->>API: refresh_token armazenado
    API->>API: Valida tokens (armazenado === enviado)
    API->>API: Emite novo access_token (15min)
    API-->>Axios: { access_token }
    Axios->>Store: Atualiza token no store
    Axios->>API: Retry da requisição original com novo token

    Note over App,DB: Logout
    App->>API: POST /auth/logout
    API->>Redis: DEL session:{userId}
    API-->>App: 200 OK
    App->>Store: clearAuth()
    Store->>Store: MMKV.delete('access_token')
```

### 7.2 Estrutura do JWT

```typescript
// Payload do Access Token
interface AccessTokenPayload {
  sub: string;    // userId (UUID)
  role: 'CLIENT' | 'ADMIN';
  iat: number;    // issued at
  exp: number;    // expira em 15 minutos
}

// Payload do Refresh Token
interface RefreshTokenPayload {
  sub: string;    // userId
  iat: number;
  exp: number;    // expira em 7 dias
}
```

---

## 8. Arquitetura de Navegação

### 8.1 Lógica de Roteamento por Role

```typescript
// src/navigation/RootNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/auth.store';

import ClientNavigator from './ClientNavigator';
import AdminNavigator from './AdminNavigator';
import AuthNavigator from './AuthNavigator';  // Login + Register

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Fluxo não autenticado
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : user?.role === 'ADMIN' ? (
          // Fluxo Admin
          <Stack.Screen name="Admin" component={AdminNavigator} />
        ) : (
          // Fluxo Client
          <Stack.Screen name="Client" component={ClientNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### 8.2 Estrutura de Navegadores

```
RootNavigator (Stack)
│
├── AuthNavigator (Stack) — não autenticado
│   ├── SplashScreen
│   ├── LoginScreen
│   └── RegisterScreen
│
├── ClientNavigator (Bottom Tabs)
│   ├── Tab: HomeScreen (Stack)
│   │   ├── HomeScreen (listagem do cardápio)
│   │   └── ItemDetailScreen
│   ├── Tab: CartScreen (Stack)
│   │   ├── CartScreen
│   │   └── PaymentScreen
│   └── Tab: OrderHistoryScreen
│
└── AdminNavigator (Drawer)
    ├── DashboardScreen
    ├── ProductListScreen (Stack)
    │   ├── ProductListScreen
    │   └── ProductFormScreen (criar/editar)
    └── StockKanbanScreen
```

---

## 9. Gerenciamento de Estado

### 9.1 Zustand — Auth Store

```typescript
// src/stores/auth.store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKVLoader } from 'react-native-mmkv-storage';

const mmkv = new MMKVLoader().initialize();

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (payload: { user: User; accessToken: string }) => void;
  updateToken: (accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken }) =>
        set({ user, accessToken, isAuthenticated: true }),

      updateToken: (accessToken) =>
        set({ accessToken }),

      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => ({
        getItem: (key) => mmkv.getString(key) ?? null,
        setItem: (key, value) => mmkv.setString(key, value),
        removeItem: (key) => mmkv.removeItem(key),
      })),
    }
  )
);
```

### 9.2 Zustand — Cart Store

```typescript
// src/stores/cart.store.ts

import { create } from 'zustand';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  obs?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    })),

  clearCart: () => set({ items: [] }),

  total: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));
```

### 9.3 Axios Interceptor (com refresh automático)

```typescript
// src/api/axios.ts

import axios, { AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth.store';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.pastalavista.com.br/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Injeta o Bearer token em toda requisição
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fila de requisições aguardando refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

// Intercepta 401 e tenta renovar o access token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: AxiosRequestConfig & { _retry?: boolean } =
      error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Encaminha para a fila e aguarda o refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${token}`,
          };
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Aqui o refresh token pode ser lido do SecureStore
        const { data } = await axios.post('/auth/refresh', {
          refresh_token: await getRefreshToken(), // helper de SecureStore
        });

        const newToken: string = data.access_token;
        useAuthStore.getState().updateToken(newToken);
        processQueue(null, newToken);

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 9.4 Divisão de Responsabilidades

| Responsabilidade            | Tecnologia          | Motivo                                              |
|-----------------------------|---------------------|-----------------------------------------------------|
| Estado do usuário e JWT     | Zustand             | Síncrono, persiste no MMKV entre sessões            |
| Itens do carrinho           | Zustand             | Estado local que não precisa de servidor            |
| Lista de produtos/cardápio  | TanStack Query      | Cache automático, re-fetch, estado de loading       |
| Histórico de pedidos        | TanStack Query      | Paginação, cache, invalidação ao criar pedido       |
| Status do estoque (Admin)   | TanStack Query      | Polling a cada 30s para atualização em tempo real   |

---

## 10. Fluxo de Pagamento

```
Cliente                     App RN                    API Express            Stripe
   │                           │                           │                    │
   │── Confirmar Pedido ───────►│                           │                    │
   │                           │── POST /pagamento/checkout►│                    │
   │                           │                           │── PaymentIntent ───►│
   │                           │                           │◄── client_secret ───│
   │                           │◄── { client_secret } ─────│                    │
   │                           │                           │                    │
   │                           │  Stripe RN SDK confirma   │                    │
   │                           │── confirmPayment() ───────────────────────────►│
   │                           │◄── payment_intent.succeeded ───────────────────│
   │                           │                           │                    │
   │                           │   (Webhook automático)    │                    │
   │                           │                           │◄── POST /pagamento/webhook
   │                           │                           │    (payment_intent.succeeded)
   │                           │                           │── Valida assinatura │
   │                           │                           │── Cria Order no DB  │
   │                           │                           │── Atualiza estoque  │
   │                           │                           │── Salva log MongoDB │
   │                           │◄── (query invalidada via  │                    │
   │                           │     TanStack Query poll)  │                    │
   │◄── Tela de Confirmação ───│                           │                    │
```

**Passos detalhados:**

1. **Checkout Iniciado** — App envia `POST /pagamento/checkout` com os itens do carrinho (snapshot de preços).
2. **PaymentIntent** — API cria um `PaymentIntent` no Stripe com o valor calculado no servidor (nunca confiar no cliente).
3. **Coleta do Pagamento** — App usa o Stripe React Native SDK com o `client_secret` retornado para exibir o formulário de cartão.
4. **Webhook de Confirmação** — Stripe envia `payment_intent.succeeded` para `POST /pagamento/webhook`. A API valida a assinatura (`stripe-signature` header) e só então cria o `Order` e registra o `Payment` no PostgreSQL.
5. **Atualização do App** — TanStack Query invalida a query de pedidos, e o usuário vê o pedido confirmado no histórico.

---

## 11. Estratégia de Cache

### 11.1 Redis — Regras de TTL

| Chave Redis                  | Dados                      | TTL        | Invalidação                              |
|------------------------------|----------------------------|------------|------------------------------------------|
| `menu:all`                   | Lista completa de produtos | 5 minutos  | POST/PATCH/DELETE `/admin/produtos`      |
| `menu:categoria:{nome}`      | Produtos por categoria     | 5 minutos  | Qualquer alteração de produto            |
| `menu:produto:{id}`          | Detalhe de produto         | 5 minutos  | PATCH/DELETE `/admin/produtos/:id`       |
| `session:{userId}`           | Refresh token              | 7 dias     | Logout ou rotação de token               |
| `stock:alerts`               | Contagem de alertas        | 1 minuto   | PATCH `/admin/estoque/:id`               |

### 11.2 Fluxo de Cache-Aside

```typescript
// menu.service.ts — padrão Cache-Aside

async getMenu(): Promise<Product[]> {
  const cached = await redis.get('menu:all');
  if (cached) return JSON.parse(cached);

  const products = await Product.find({ active: true }).lean();

  await redis.set('menu:all', JSON.stringify(products), 'EX', 300); // 5min

  return products;
}

async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
  const updated = await Product.findByIdAndUpdate(id, data, { new: true });

  // Invalida todas as chaves de cache relacionadas ao cardápio
  const keys = await redis.keys('menu:*');
  if (keys.length) await redis.del(...keys);

  return updated;
}
```

### 11.3 TanStack Query — Cache no Cliente

| Query Key                    | staleTime   | gcTime    | Refetch              |
|------------------------------|-------------|-----------|----------------------|
| `['menu']`                   | 3 minutos   | 10 minutos| onWindowFocus        |
| `['menu', id]`               | 3 minutos   | 10 minutos| onWindowFocus        |
| `['orders', 'my']`           | 30 segundos | 5 minutos | onWindowFocus        |
| `['admin', 'orders']`        | 15 segundos | 5 minutos | refetchInterval: 30s |
| `['admin', 'stock']`         | 15 segundos | 5 minutos | refetchInterval: 30s |

---

## 12. Armazenamento de Arquivos

### 12.1 Fluxo de Upload para Cloudflare R2

```
Admin App                  API Express              Cloudflare R2
    │                           │                        │
    │── POST /admin/produtos    │                        │
    │   /:id/imagem             │                        │
    │   (multipart/form-data)   │                        │
    │                           │── Recebe buffer        │
    │                           │── Gera key única:      │
    │                           │   produtos/{id}/{uuid}.webp
    │                           │── Sharp: resize/webp   │
    │                           │── S3 PutObject ────────►│
    │                           │◄── ETag / success ──────│
    │                           │── Salva imageUrl no MongoDB
    │                           │   (via CDN público)    │
    │◄── { imageUrl: "https://cdn.pastalavista.com.br/..." }
```

### 12.2 Configuração do Client R2

```typescript
// src/utils/r2.ts

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,          // https://<account>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadProductImage(
  buffer: Buffer,
  productId: string
): Promise<string> {
  const key = `produtos/${productId}/${uuid()}.webp`;

  // Converte para WebP e redimensiona para 800x800
  const optimized = await sharp(buffer)
    .resize(800, 800, { fit: 'inside' })
    .webp({ quality: 85 })
    .toBuffer();

  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: optimized,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000', // 1 ano de cache CDN
  }));

  return `${process.env.CDN_BASE_URL}/${key}`;
}
```

### 12.3 Entrega via CDN

- **Base URL CDN:** `https://cdn.pastalavista.com.br` → aponta para o bucket R2 via Cloudflare.
- **Cache-Control:** `public, max-age=31536000` — imagens cacheadas por 1 ano na borda.
- **Purge de cache:** Ao substituir imagem de um produto, o `key` é único por upload (UUID), eliminando problemas de cache stale.

---

## 13. Pipeline CI/CD

### 13.1 API — `.github/workflows/api-ci.yml`

```yaml
name: API CI/CD

on:
  push:
    branches: [main]
    paths: ['api/**']
  pull_request:
    paths: ['api/**']

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: api
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: api/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test        # Jest unit tests

  deploy:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy para Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: pasta-la-vista-api
```

### 13.2 Mobile — `.github/workflows/mobile-ci.yml`

```yaml
name: Mobile CI

on:
  push:
    branches: [main]
    paths: ['mobile/**']
  pull_request:
    paths: ['mobile/**']

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: mobile
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: mobile/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  eas-build:
    needs: lint-and-typecheck
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
        working-directory: mobile
      - name: Setup Expo e EAS CLI
        run: npm install -g eas-cli
      - name: Build Android (EAS)
        working-directory: mobile
        run: eas build --platform android --profile preview --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      - name: Download APK gerado pelo EAS
        working-directory: mobile
        run: eas build:list --platform android --status finished --limit 1 --json > build-info.json
```

---

## 14. Variáveis de Ambiente

### 14.1 API — `/api/.env.example`

```bash
# ─── Servidor ───────────────────────────────────
NODE_ENV=development                        # development | production
PORT=3333

# ─── JWT ────────────────────────────────────────
JWT_SECRET=sua_chave_secreta_256bits        # Chave de assinatura dos access tokens
JWT_EXPIRES_IN=15m                          # Duração do access token
JWT_REFRESH_SECRET=outra_chave_secreta      # Chave separada para refresh tokens
JWT_REFRESH_EXPIRES_IN=7d                   # Duração do refresh token

# ─── PostgreSQL ──────────────────────────────────
DATABASE_URL=postgresql://user:pass@host:5432/pastalavista

# ─── MongoDB ─────────────────────────────────────
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/pastalavista

# ─── Redis ───────────────────────────────────────
REDIS_URL=rediss://default:pass@upstash.io:6380

# ─── Cloudflare R2 ───────────────────────────────
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=sua_access_key
R2_SECRET_ACCESS_KEY=sua_secret_key
R2_BUCKET_NAME=pasta-la-vista-assets
CDN_BASE_URL=https://cdn.pastalavista.com.br   # Domínio público do R2

# ─── Stripe ──────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_xxxxx                 # sk_test_ para desenvolvimento
STRIPE_WEBHOOK_SECRET=whsec_xxxxx               # Segredo do endpoint de webhook

# ─── Rate Limiting ───────────────────────────────
RATE_LIMIT_WINDOW_MS=900000                     # 15 minutos em ms
RATE_LIMIT_MAX=100                              # Máximo de requisições por janela
```

### 14.2 Mobile — `/mobile/.env.example`

```bash
# ─── API ─────────────────────────────────────────
# Prefixo EXPO_PUBLIC_ obrigatório para variáveis expostas ao bundle
EXPO_PUBLIC_API_BASE_URL=https://api.pastalavista.com.br/api/v1
EXPO_PUBLIC_CDN_BASE_URL=https://cdn.pastalavista.com.br

# ─── Stripe ──────────────────────────────────────
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx   # pk_test_ para desenvolvimento
```

---

## 15. Definição de Pronto

> **Critérios globais** aplicados a todas as histórias de usuário:
> - Código revisado (PR aprovado por ≥ 1 membro)
> - Tipagem TypeScript sem erros (`tsc --noEmit`)
> - Lint passando (`eslint` sem warnings críticos)
> - CI/CD verde no GitHub Actions

---

### Sprint 1 — Semana 1: Autenticação e Fundações

**Objetivo:** Fluxo completo de auth (React Native ↔ API) end-to-end.

| # | Critério de Aceite |
|---|-------------------|
| 1 | `POST /auth/register` cria usuário com senha hasheada (bcrypt) e retorna JWT |
| 2 | `POST /auth/login` retorna `access_token` (15min) e `refresh_token` (7d) |
| 3 | `POST /auth/refresh` valida refresh token no Redis e emite novo access token |
| 4 | Telas de Login e Register funcionam com validação via React Hook Form |
| 5 | Token salvo no MMKV e injetado automaticamente pelo Axios interceptor |
| 6 | Navegação redireciona para fluxo correto baseado no `role` do JWT |
| 7 | Rotas protegidas retornam 401 sem token válido |
| 8 | Prisma migrations aplicadas com sucesso no banco PostgreSQL |

---

### Sprint 2 — Semana 2: Cardápio, Carrinho e Pedidos

**Objetivo:** Cliente consegue navegar pelo cardápio, montar carrinho e criar um pedido.

| # | Critério de Aceite |
|---|-------------------|
| 1 | `GET /menu` retorna produtos do Redis (cache hit) com TTL de 5 minutos |
| 2 | HomeScreen exibe cardápio com categorias, imagens CDN e preços |
| 3 | ItemDetailScreen mostra detalhes e opções de customização do produto |
| 4 | Zustand Cart Store gerencia adição, remoção e atualização de quantidade |
| 5 | `POST /pedidos` cria pedido com snapshot de preços calculado no servidor |
| 6 | Admin consegue fazer upload de imagem via `POST /admin/produtos/:id/imagem` (R2) |
| 7 | Produtos com `stock.status === OUT_OF_STOCK` não aparecem no cardápio |
| 8 | TanStack Query invalida cache de pedidos após criação bem-sucedida |

---

### Sprint 3 — Semana 3: Pagamento, Admin e Estoque

**Objetivo:** Fluxo de pagamento Stripe funcionando; painel admin completo.

| # | Critério de Aceite |
|---|-------------------|
| 1 | `POST /pagamento/checkout` cria PaymentIntent e retorna `client_secret` |
| 2 | Stripe React Native SDK coleta dados do cartão e confirma pagamento |
| 3 | Webhook `payment_intent.succeeded` cria `Order` e `Payment` no PostgreSQL |
| 4 | Assinatura do webhook Stripe validada com `stripe-signature` |
| 5 | Admin Dashboard exibe contagem de pedidos por status e alertas de estoque |
| 6 | CRUD de produtos funcional no painel admin (criar, editar, desativar) |
| 7 | Stock Kanban exibe colunas (Disponível / Baixo / Esgotado) com drag-and-drop |
| 8 | `PATCH /admin/estoque/:id` atualiza quantidade e recalcula `status` automaticamente |
| 9 | `GET /admin/estoque/alertas` retorna apenas itens LOW e OUT_OF_STOCK |
| 10| OrderHistoryScreen lista pedidos do cliente com status atualizado |
| 11| Deploy da API no Railway com variáveis de ambiente configuradas |
| 12| Build Android gerado via EAS Build e testado em dispositivo físico / emulador |

---

*Documento gerado automaticamente. Atualizar a cada sprint retrospectiva conforme evolução do projeto.*

---

## 16. Roadmap de Funcionalidades

> Funcionalidades planejadas para sprints futuras, organizadas por domínio. Cada item inclui o ponto de extensão arquitetural relevante no codebase atual.

---

### 16.1 Experiência do Cliente

#### Avaliação de Pedidos (1–5 estrelas)

Criar um `ReviewSchema` no MongoDB, aninhado ou separado do `order_logs`. O endpoint `POST /pedidos/:id/avaliacao` (auth: Client) valida que o pedido tem status `DELIVERED` antes de persistir. No mobile, exibir a tela pós-entrega como um `Stack.Screen` dentro do `ClientNavigator`, disparado quando `OrderHistoryScreen` detecta status `DELIVERED` via TanStack Query.

```typescript
// Adicionar ao OrderLogSchema (MongoDB)
const ReviewSchema = new Schema({
  rating:    { type: Number, min: 1, max: 5, required: true },
  comment:   { type: String, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});
// Adicionar campo ao OrderLogSchema:
review: { type: ReviewSchema, default: null }
```

#### Favoritos

Adicionar ao `schema.prisma` uma tabela `UserFavorite` e uma nova aba "Favoritos" no `ClientNavigator` (Bottom Tabs). O `productId` referencia o `_id` do MongoDB, seguindo o padrão cross-DB já usado em `OrderItem.productId`.

```prisma
model UserFavorite {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  productId String   @map("product_id") // ref MongoDB
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  @@unique([userId, productId])
}
```

Rotas: `POST /favoritos/:productId`, `DELETE /favoritos/:productId`, `GET /favoritos` (auth: Client).

#### Tags para os Pratos

O `ProductSchema` no MongoDB já possui o campo `tags: [{ type: String }]` — basta populá-lo com valores controlados como `"vegetariano"`, `"sem-gluten"`, `"vegano"`. Adicionar um enum TypeScript `DietaryTag` e um filtro opcional em `GET /menu?tags=vegetariano,sem-gluten` no `menu.service.ts`.

#### Notificações Push (FCM)

Adicionar `fcmToken: String?` ao modelo `User` no Prisma e ao registro/login. O webhook interno de mudança de status em `PATCH /admin/pedidos/:id` dispara um evento para um `notification.service.ts` que chama a FCM Admin SDK apenas quando o novo status for `PREPARING`, `READY` ou `DELIVERED`.

```
Nova variável de ambiente: FCM_SERVER_KEY=...
```

#### Modo Retirada vs. Entrega

Extender o modelo `Order` no Prisma e o body de `POST /pedidos`:

```prisma
model Order {
  // ... campos existentes ...
  deliveryMode    DeliveryMode @default(DELIVERY) @map("delivery_mode")
  deliveryAddress String?      @map("delivery_address")
  deliveryFee     Decimal?     @db.Decimal(10, 2) @map("delivery_fee")
}

enum DeliveryMode { PICKUP DELIVERY }
```

A taxa de entrega é calculada no servidor em `order.service.ts` antes de criar o `PaymentIntent`, nunca no cliente.

#### Cupons de Desconto

Nova tabela no Prisma e validação no servidor antes do checkout:

```prisma
model Coupon {
  id           String       @id @default(uuid())
  code         String       @unique
  discountType DiscountType // PERCENTAGE | FIXED
  value        Decimal      @db.Decimal(10, 2)
  expiresAt    DateTime     @map("expires_at")
  usageLimit   Int?         @map("usage_limit")
  usageCount   Int          @default(0) @map("usage_count")
}

enum DiscountType { PERCENTAGE FIXED }
```

Rota: `POST /cupons/validar { code, orderTotal }` — retorna desconto calculado. A aplicação acontece em `POST /pagamento/checkout`, que já centraliza o cálculo de valor.

---

### 16.2 Painel Admin

#### Dashboard com Métricas Reais

Ampliar o `DashboardScreen.tsx` com queries ao novo endpoint `GET /admin/dashboard/metricas`, que agrega no PostgreSQL (faturamento, ticket médio, top produtos por `OrderItem`) e aplica cache Redis com TTL de 1 minuto — consistente com a chave `stock:alerts` já existente.

#### Gestão de Categorias

Criar módulo `api/src/modules/categories/` com CRUD completo:

| Método | Rota                     | Auth       |
|--------|--------------------------|------------|
| GET    | `/admin/categorias`      | 🔐 Admin   |
| POST   | `/admin/categorias`      | 🔐 Admin   |
| PATCH  | `/admin/categorias/:id`  | 🔐 Admin   |
| DELETE | `/admin/categorias/:id`  | 🔐 Admin   |

Categorias persistidas no MongoDB (ou PostgreSQL como tabela `Category` referenciada pelo `ProductSchema`). Ao deletar/renomear, invalida as chaves `menu:categoria:*` no Redis.

#### Relatório de Vendas Exportável

Endpoint `GET /admin/relatorios/vendas?from=&to=&format=csv|json` — query no PostgreSQL via Prisma agregando `Order` + `OrderItem`. Para CSV, usar a lib `csv-stringify`. Sem cache (query paramétrica por datas).

#### Log de Auditoria

Aproveitar o `StatusHistorySchema` já existente no MongoDB, criando uma collection separada `audit_logs`:

```typescript
const AuditLogSchema = new Schema({
  adminId:    { type: String, required: true },
  action:     { type: String, required: true }, // "UPDATE_PRODUCT", "UPDATE_STOCK"
  targetId:   { type: String, required: true },
  targetType: { type: String },                 // "Product" | "Order" | "Stock"
  before:     Schema.Types.Mixed,
  after:      Schema.Types.Mixed,
  changedAt:  { type: Date, default: Date.now },
});
```

Implementar como middleware no `role.middleware.ts` ou diretamente nos services admin.

---

### 16.3 Técnico / Infraestrutura

#### Soft Delete para Usuários (LGPD)

Adicionar ao modelo `User` no Prisma:

```prisma
model User {
  // ... campos existentes ...
  deletedAt DateTime? @map("deleted_at")
  // Em vez de deletar: anonimizar name/email ao setar deletedAt
}
```

O endpoint `DELETE /auth/me` seta `deletedAt = now()` e anonimiza `name` e `email` no PostgreSQL, sem remover o registro para preservar integridade de `Order.userId`.

#### Testes E2E com Detox

Adicionar ao `mobile-ci.yml` um novo job após `eas-build`:

```yaml
e2e-detox:
  needs: eas-build
  runs-on: macos-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm ci
      working-directory: mobile
    - run: npx detox build --configuration android.emu.debug
    - run: npx detox test --configuration android.emu.debug
      working-directory: mobile
```

Cobrir os fluxos: login → cardápio → carrinho → checkout → confirmação.

#### Health Check Endpoint

Adicionar `GET /health` antes dos middlewares de auth em `app.ts`:

```typescript
app.get('/health', async (req, res) => {
  const [pg, mongo, redis] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    mongoose.connection.db.admin().ping(),
    redisClient.ping(),
  ]);
  const status = (r: PromiseSettledResult<any>) =>
    r.status === 'fulfilled' ? 'ok' : 'error';

  res.json({
    postgres: status(pg),
    mongodb:  status(mongo),
    redis:    status(redis),
    uptime:   process.uptime(),
  });
});
```

O Railway usa esse endpoint para restart automático — configurar como health check path no painel do Railway.

#### Versionamento de API

Prefixar todas as rotas existentes com `/api/v1/` no `app.ts`, unificando os routers:

```typescript
// app.ts
app.use('/api/v1/auth',     authRouter);
app.use('/api/v1/menu',     menuRouter);
app.use('/api/v1/pedidos',  orderRouter);
app.use('/api/v1/admin',    adminRouter);
app.use('/api/v1/pagamento', paymentRouter);
// /health permanece sem versionamento
```

Atualizar `EXPO_PUBLIC_API_BASE_URL` no `.env.example` do mobile para `https://api.pastalavista.com.br/api/v1`, e ajustar a `baseURL` do Axios em `mobile/src/api/axios.ts`.

---