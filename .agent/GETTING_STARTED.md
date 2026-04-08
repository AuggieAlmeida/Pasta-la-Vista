# Pasta la Vista — Getting Started

Um aplicativo de delivery de comida completo com autenticação, cardápio, carrinho e pedidos. Arquitetura monorepo com backend Express/TypeScript e mobile React Native/Expo.

---

## Requisitos

- **Node.js** 22+ LTS
- **npm** 9+
- **Git** (para versionamento)

---

## Setup Inicial

### 1. Clonar Repositório

```bash
git clone https://github.com/AuggieAlmeida/Pasta-la-Vista.git
cd Pasta-la-Vista
```

### 2. Configurar Variáveis de Ambiente

#### Backend — `api/.env.local`

```env
# Database
DATABASE_URL="postgresql://user:password@host/db"
DIRECT_URL="postgresql://user:password@host/db"
MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/db"
REDIS_URL="redis://default:password@host:port"

# JWT
JWT_SECRET="seu_jwt_secret_aqui_min_32_chars"
JWT_REFRESH_SECRET="seu_jwt_refresh_secret_aqui_min_32_chars"

# App
NODE_ENV="development"
PORT=3333
APP_URL="http://localhost:3333"

# Cloudflare (R2)
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_ACCESS_KEY="your-access-key"
CLOUDFLARE_SECRET_KEY="your-secret-key"
CLOUDFLARE_BUCKET_NAME="pastalavista"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Obtenha os valores de:
- **Supabase**: PostgreSQL connection string do dashboard
- **MongoDB Atlas**: Connection string da cluster
- **Upstash**: Redis connection string
- **Cloudflare**: Account ID e API tokens
- **Stripe**: Keys de teste (começam com `sk_test_` e `pk_test_`)

#### Mobile — `mobile/.env.local`

```env
# Will be loaded into app.config.ts
EXPO_PUBLIC_API_BASE_URL="http://localhost:3333/api/v1"
EXPO_PUBLIC_STRIPE_PUBLIC_KEY="pk_test_..."
```

### 3. Instalar Dependências

```bash
# Backend
cd api
npm install

# Nome novo terminal:
cd mobile
npm install
npm install -g expo-cli  # Se não tiver globalmente
```

### 4. Executar Migrações Prisma

```bash
cd api
npm run prisma:migrate dev -- --name init
```

Isso:
- Cria tabelas em PostgreSQL (Supabase)
- Gera tipos TypeScript
- Cria seed data se tiver [`prisma/seed.ts`](./api/prisma/seed.ts)

### 5. Iniciar Servidor Backend

```bash
cd api
npm run dev
```

Esperado:
```
✓ TypeScript compilado
✓ Express servidor rodando em http://localhost:3333
✓ Prisma conectado ao PostgreSQL
✓ Redis cache conectado
✓ Mongoose conectado ao MongoDB
```

### 6. Iniciar App Mobile

Em outro terminal:

```bash
cd mobile
npm start
```

Opções:
- Pressionar `i` para abrir iOS simulator
- Pressionar `a` para abrir Android emulator
- Escanear QR code com Expo Go (iPhone/Android)

---

## Verificação Local

### Health Check Backend

```bash
curl http://localhost:3333/health
# Response: {"status":"ok"}
```

### Testar Endpoints de Auth

#### Registro

```bash
curl -X POST http://localhost:3333/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "Senha@123",
    "phone": "+5511999999999"
  }'
```

Response:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid...",
      "email": "joao@example.com",
      "name": "João Silva",
      "role": "CLIENT"
    },
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

#### Login

```bash
curl -X POST http://localhost:3333/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "Senha@123"
  }'
```

#### Refresh Token

```bash
curl -X POST http://localhost:3333/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <refresh_token_aqui>" \
  -d '{}'
```

#### Logout

```bash
curl -X POST http://localhost:3333/api/v1/auth/logout \
  -H "Authorization: Bearer <access_token_aqui>"
```

---

## Testes

### Backend — Jest + Supertest

```bash
cd api
npm test
```

Testa:
- Registro (válido e inválido)
- Login (credenciais corretas e erradas)
- Refresh token
- Logout
- Health check

Cobertura esperada: **~85% do módulo auth**

---

## Projeto Structure

```
Pasta-la-Vista/
├── .agent/                   # Documentação especializada
│   ├── ARCHITECTURE.md      # Diagrama técnico e tech stack
│   ├── SCOPE.md            # Roadmap Fase 0 → Sprint 3
│   ├── CURRENT_PROJECT_STATUS.md
│   └── SPRINT_1_SUMMARY.md
├── api/                      # Backend Express + TypeScript
│   ├── src/
│   │   ├── modules/auth/    # Serviço de autenticação
│   │   ├── middleware/      # Guards e validators
│   │   ├── routes/          # Router Express
│   │   ├── utils/           # JWT, hashing, etc
│   │   ├── config/          # Database connections
│   │   ├── app.ts
│   │   └── index.ts
│   ├── prisma/              # ORM schema
│   ├── tests/               # Jest + Supertest
│   ├── package.json
│   └── .env.local          # Variáveis (não commitado)
│
├── mobile/                   # Frontend React Native + Expo
│   ├── src/
│   │   ├── screens/         # SplashScreen, LoginScreen
│   │   ├── navigation/      # RootNavigator, stacks
│   │   ├── stores/          # Zustand auth store
│   │   ├── api/             # Axios com interceptors
│   │   └── types/           # Zod schemas
│   ├── app.json             # Config Expo
│   ├── package.json
│   ├── App.tsx
│   └── .env.local
│
└── .gitignore
```

---

## Fluxo de Autenticação

1. **User abre app**
   - SplashScreen verifica token em AsyncStorage
   - Se existe → ClientNavigator (ou AdminNavigator)
   - Se não → LoginScreen

2. **User registra**
   - RegisterScreen → POST /register
   - Backend cria User + emite tokens
   - Tokens armazenados em Redis (7d lifetime)
   - Mobile salva em AsyncStorage + Zustand
   - Auto-login → ClientNavigator

3. **User faz requisição com token expirado**
   - Axios interceptor detecta 401
   - Faz POST /refresh automaticamente
   - Novo access_token obtido
   - Requisição original retry sem user notificar
   - Se refresh falha → logout + volta a LoginScreen

---

## Troubleshooting

### PostgreSQL connection error

```
Error: getaddrinfo ENOTFOUND host
```

**Solução:**
- Verificar `DATABASE_URL` em `.env.local`
- Teste com: `psql $DATABASE_URL -c "SELECT 1"`
- Se Supabase: usar a pooler connection URL não a direct URL

### Redis connection timeout

```
Error: connect ECONNREFUSED
```

**Solução:**
- Verificar se Redis está rodando: `redis-cli ping`
- Se Upstash: copiar connection string do console

### Mobile app branco (blank screen)

**Solução:**
- Verificar logs: `expo start --clear`
- Limpar bundle: `npm run clean && npm start`
- Verificar `.env.local` has `EXPO_PUBLIC_API_BASE_URL`

### TypeScript errors

```bash
npm run type-check   # Verificar todos tipos
npm run lint         # Verificar linting
```

---

## Próximos Passos

Após confirmar que backend + mobile rodam localmente:

1. **Sprint 2**: Menu service com Redis cache + Cart + Orders
2. **Sprint 3**: Admin dashboard com stock management
3. **Sprint 4**: Pagamentos com Stripe

Veja [SCOPE.md](./.agent/SCOPE.md) para detalhes de cada sprint.

---

## Contribuindo

1. Crie branch: `git checkout -b feature/sua-feature`
2. Commit regular: `git commit -m "feat: descrição clara"`
3. Push: `git push origin feature/sua-feature`
4. Abra PR com descrição detalhada

---

## Stack Resumido

| Layer | Tech | Version |
|-------|------|---------|
| **Runtime** | Node.js | 22 LTS |
| **Backend** | Express + TypeScript | 5.x + 5.3+ |
| **Database** | PostgreSQL (Supabase) | Latest |
| **ODM** | Mongoose | 8.x |
| **Cache** | Redis (Upstash) | 7.x |
| **ORM** | Prisma | 5.x |
| **Mobile** | React Native + Expo | 0.73 + SDK 51 |
| **State** | Zustand | 4.4.1 |
| **Forms** | React Hook Form + Zod | 7.51 + 3.22 |
| **HTTP** | Axios | 1.6.5 |
| **Testing** | Jest + Supertest | 29.x + 6.x |

---

**Happy coding! 🍝**

Para dúvidas, veja [ARCHITECTURE.md](./.agent/ARCHITECTURE.md) ou abra uma issue no GitHub.
