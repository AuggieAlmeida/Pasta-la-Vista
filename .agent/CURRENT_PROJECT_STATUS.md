# Projeto: Pasta la Vista — Status de Implementação

> **Status Atual:** Fase 0 — 95% Completo | Sprint 1 — Iniciando  
> **Data de Início:** 7 de abril de 2026  
> **Última Atualização:** 8 de abril de 2026  
> **Próximas Ações:** Implementar Sprint 1 (Autenticação e Fundações)

---

## FASE 0: Setup & Infraestrutura

### Status: Completo (95%) ✅

#### 0.1 — Repositório e Estrutura Local ✅

- [x] **0.1.1** — Monorepo GitHub criado (`pasta-la-vista`)
  - `.gitignore` completo com node_modules, .env, .expo/, dist/, build/, migrations
  - Branch `main` inicializado com 2 commits
  
- [x] **0.1.2** — Pastas base `/api` e `/mobile` configuradas
  - `api/package.json` com scripts: dev, build, start, lint, type-check, test, prisma commands
  - `mobile/package.json` com scripts: start, android, ios, build, lint, type-check
  
- [x] **0.1.3** — `.env.example` criados em ambos com valores reais (não expor em produção)
  - `api/.env.example`: DATABASE_URL, DIRECT_URL, MONGODB_URI, REDIS_URL, JWT secrets, Stripe, R2, CORS
  - `mobile/.env.example`: API_BASE_URL, Stripe PK, App config
  - `.env.local` criados com credenciais reais para desenvolvimento

**Acceptance Criteria:** ✅  
- ✅ Repositório público no GitHub: https://github.com/AuggieAlmeida/Pasta-la-Vista
- ✅ `git clone` + `npm install` em ambos os diretórios funciona
- ✅ Primeiro e segundo commits feitos com sucesso

---

#### 0.4 — TypeScript & Linting Config ✅

**API**

- [x] **0.4.1** — `api/tsconfig.json` com strict mode
  - strictNullChecks, noImplicitAny, esModuleInterop ativados
  - target: ES2020, module: ESNext
  
- [x] **0.4.2** — `api/.eslintrc.json` configurado
  - Parser: @typescript-eslint/parser
  - Regras: @typescript-eslint com recomendações
  
- [x] **0.4.3** — Scripts em `api/package.json`
  - lint, lint:fix, type-check configurados

**Mobile**

- [x] **0.4.4** — `mobile/tsconfig.json` (Expo preset)
  - Baseado no expo/tsconfig com strict mode
  
- [x] **0.4.5** — `mobile/.eslintrc.json` com plugins
  - Plugins: react-hooks, react-native, @typescript-eslint
  
- [x] **0.4.6** — `mobile/babel.config.js`
  - Preset: babel-preset-expo
  - Plugin: react-native-reanimated/plugin
  
- [x] **0.4.7** — Scripts em `mobile/package.json`
  - lint, lint:fix, type-check configurados

**Acceptance Criteria:** ✅  
- ✅ npm run type-check passa em ambos
- ✅ npm run lint passa em ambos (com warnings, sem erros)

#### 0.3 — CI/CD Pipeline (GitHub Actions) ✅

- [x] **0.3.1** — `.github/workflows/api-ci.yml`
  - Triggers: Push em main/develop, PRs, paths api/**
  - Jobs: lint → type-check → test → build
  - Deploy: Render (placeholder, aguarda RENDER_TOKEN)
  
- [x] **0.3.2** — `.github/workflows/mobile-ci.yml`
  - Triggers: Push em main/develop, PRs, paths mobile/**
  - Jobs: lint → type-check → build-preview
  - Build: EAS preview (placeholder, aguarda EXPO_TOKEN)

**Acceptance Criteria:** ✅  
- ✅ Workflows criados e sincronizados com repositório
- ✅ Lint e type-check funcionam localmente

#### 0.2 — Contas e Credenciais Cloud ✅

Serviços provisionados com credenciais configuradas:

| Serviço | Status | Detalhes |
|---------|--------|----------|
| Supabase | ✅ | DB: pastalavista_dev, DATABASE_URL + DIRECT_URL |
| MongoDB Atlas | ✅ | Cluster: pasta-la-vista, MONGODB_URI configurado |
| Upstash Redis | ✅ | DB criado, REDIS_URL configurado |
| Cloudflare R2 | ✅ | Bucket: plv-images, R2_* credentials configuradas |
| Stripe | ✅ | Test mode, sk_test_ e pk_test_ configurados |
| Render | ⏳ | Aguarda primeira deploy (token será criado) |
| Expo | ⏳ | EXPO_TOKEN necessário para CI/CD |

**Acceptance Criteria:** ✅ (parcial)
- ✅ Todos os .env.example sincronizados
- ✅ Conexões locais testadas e funcionando
- ⏳ GitHub Secrets não foram adicionados (próxima etapa)

#### 0.5 — Base de Dados — Setup Inicial ✅

- [x] **0.5.1** — PostgreSQL Supabase (`pastalavista_dev`)
  - DATABASE_URL: postgresql://... com pooler connection
  - DIRECT_URL: postgresql://... para migrations
  - Tabelas: users, orders, order_items, stocks, payments (Prisma schema criado)
  
- [x] **0.5.3** — MongoDB Atlas (`pastalavista_dev`)
  - MONGODB_URI: mongodb+srv://... configurado
  - Schemas: Product, Customization, OrderLog ready
  
- [x] **0.5.5** — Redis Upstash
  - REDIS_URL: rediss://... configurado
  - Pronto para cache (TTL 5min para menu)

**Acceptance Criteria:** ✅  
- ✅ Conexões testadas localmente
- ✅ Todas as BDs acessíveis via .env.local

---

## 📊 Estrutura de Diretórios Criada

```
pasta-la-vista/
├── .github/
│   └── workflows/
│       ├── api-ci.yml           
│       └── mobile-ci.yml        
├── api/
│   ├── src/
│   │   ├── index.ts              (entry point)
│   │   ├── app.ts                (Express app setup)
│   │   ├── middleware/          
│   │   ├── modules/
│   │   │   ├── auth/            
│   │   │   └── menu/            
│   │   ├── routes/              
│   │   ├── utils/               
│   │   └── types/               
│   ├── tests/                   
│   ├── prisma/
│   │   └── schema.prisma        
│   ├── package.json             
│   ├── tsconfig.json            
│   ├── .eslintrc.json           
│   ├── jest.config.js           
│   └── .env.example             
├── mobile/
│   ├── src/
│   │   ├── screens/             
│   │   ├── navigation/          
│   │   ├── stores/              
│   │   ├── api/                 
│   │   ├── components/          
│   │   ├── utils/               
│   │   └── types/               
│   ├── assets/                  
│   ├── App.tsx                  
│   ├── app.json                 
│   ├── app.config.ts            
│   ├── babel.config.js          
│   ├── eas.json                 
│   ├── package.json             
│   ├── tsconfig.json            
│   ├── .eslintrc.json           
│   └── .env.example             
├── .gitignore                   
├── README.md                    
└── SCOPE.md                      (referência)
```

---

## SPRINT 1: Autenticação e Fundações

### Status: Iniciando (0%) ⏳

**Duração:** 1 semana  
**Dependências:** Fase 0 — Completa ✅  
**Objetivo:** Login/registro funcional, JWT, navegação condicional por role

### Tarefas — Sprint 1

#### 1.1 — Backend: Prisma Schema & Migrations ⏳

- [ ] **1.1.1** — Criar `api/prisma/schema.prisma` (já criado, falta migrations)
  - Schema completo com User, Order, OrderItem, Stock, Payment
  - Enums: Role (CLIENT, ADMIN), OrderStatus, StockStatus
  
- [ ] **1.1.2** — Executar `prisma migrate dev --name init`
  - Gerar migrações e aplicar ao banco PostgreSQL Supabase

**Checklist:**
- [ ] `npm run prisma:migrate` executa sem erro
- [ ] `npm run prisma:studio` abre UI com tabelas

#### 1.2 — Backend: Auth Service ⏳

- [ ] **1.2.1** — `api/src/modules/auth/auth.schema.ts`
  - Schemas Zod: RegisterSchema, LoginSchema, RefreshSchema
  
- [ ] **1.2.2** — `api/src/modules/auth/auth.service.ts`
  - register(dto): hash senha, criar User, retornar tokens
  - login(email, password): validar credenciais, emitir JWT
  - refreshToken(token): validar refresh, emitir novo access token
  - logout(userId): limpar sessão Redis
  
- [ ] **1.2.3** — `api/src/modules/auth/auth.controller.ts`
  - POST /api/v1/auth/register
  - POST /api/v1/auth/login
  - POST /api/v1/auth/refresh
  - POST /api/v1/auth/logout (com auth guard)
  
- [ ] **1.2.4** — `api/src/utils/jwt.ts`
  - signAccessToken(userId, role): retorna token 15min
  - signRefreshToken(userId): retorna token 7d
  - verifyAccessToken(token): valida e retorna payload
  - verifyRefreshToken(token): valida e retorna payload

**Checklist:**
- [ ] POST /auth/register cria User com senha hasheada no PostgreSQL
- [ ] POST /auth/login retorna JWT válido
- [ ] Access token expira em 15min, refresh em 7d
- [ ] POST /auth/refresh emite novo access token

#### 1.3 — Backend: Middleware ⏳

- [ ] **1.3.1** — `api/src/middleware/auth.middleware.ts`
  - Extrair Bearer token
  - Validar JWT
  - Anexar req.user com {id, role}
  - Retornar 401 se inválido
  
- [ ] **1.3.2** — `api/src/middleware/role.middleware.ts`
  - Validar role contra lista de roles permitidas
  - Retornar 403 se não autorizado
  
- [ ] **1.3.3** — `api/src/middleware/validate.middleware.ts`
  - Factory que aceita schema Zod
  - Validar req.body
  - Retornar 400 com erro formatado
  
- [ ] **1.3.4** — `api/src/middleware/rateLimit.middleware.ts`
  - 100 req/15min geral
  - 20 req/15min para /auth

**Checklist:**
- [ ] Sem Bearer token → 401
- [ ] Token inválido → 401
- [ ] Admin guard sem role ADMIN → 403
- [ ] Body inválido → 400

#### 1.4 — Backend: Express App Setup ⏳

- [ ] **1.4.1** — Atualizar `api/src/app.ts` com routers
  - Registrar authRouter em /api/v1/auth
  - Registrar placeholder routers para menu, orders, stock, payment
  
- [ ] **1.4.2** — Criar `api/src/routes/auth.routes.ts`
  - Express Router com endpoints auth
  
- [ ] **1.4.3** — Criar `api/src/config/database.ts`
  - Conectar Prisma ao PostgreSQL
  - Conectar Mongoose ao MongoDB
  - Conectar ioredis ao Redis
  
- [ ] **1.4.4** — Verificar `api/src/index.ts`
  - Entry point com inicialização de BD's

**Checklist:**
- [ ] npm run dev inicia server na porta 3333
- [ ] curl http://localhost:3333/health retorna {status: ok}

#### 1.5 — Frontend Mobile: Setup Expo ⏳

- [ ] **1.5.1** — Verificar `mobile/app.json`
- [ ] **1.5.2** — Verificar `mobile/app.config.ts`
- [ ] **1.5.3** — Verificar `mobile/eas.json`
- [ ] **1.5.4** — Instalar dependências (já em package.json)

**Checklist:**
- [ ] expo start abre app sem erro
- [ ] npm run type-check passa

#### 1.6 — Frontend Mobile: Auth Store (Zustand) ⏳

- [ ] **1.6.1** — Criar `mobile/src/stores/auth.store.ts`
  - Interface User (id, name, email, role)
  - Interface AuthState (user, accessToken, isAuthenticated, setAuth, updateToken, clearAuth)
  - Persistência com MMKV
  
- [ ] **1.6.2** — Testar persistência
  - Store hidrata ao iniciar

**Checklist:**
- [ ] setAuth() persiste token
- [ ] Store reidrata ao reabrir app

#### 1.7 — Frontend Mobile: Axios Config ⏳

- [ ] **1.7.1** — Criar `mobile/src/api/axios.ts`
  - Instância Axios com baseURL
  - Request interceptor: injeta Bearer token
  - Response interceptor: handle 401 e refresh automático
  - Queue de requisições

**Checklist:**
- [ ] Requisição autenticada automaticamente
- [ ] Token expirado → refresh → retry

#### 1.8 — Frontend Mobile: Auth Screens ⏳

- [ ] **1.8.1** — Criar `mobile/src/screens/SplashScreen.tsx`
  - Logo + carregamento
  - Verifica token no store
  - Redireciona para login ou home
  
- [ ] **1.8.2** — Criar `mobile/src/screens/LoginScreen.tsx`
  - Form com email + password (React Hook Form)
  - Validação Zod
  - Chama POST /auth/login
  - Salva token no store
  
- [ ] **1.8.3** — Criar `mobile/src/screens/RegisterScreen.tsx`
  - Form com name, email, password, password confirm
  - Validação Zod
  - Chama POST /auth/register
  - Auto-login

**Checklist:**
- [ ] Registro funcional
- [ ] Login funcional
- [ ] Erro de credenciais exibido
- [ ] Token persiste

#### 1.9 — Frontend Mobile: Navigation ⏳

- [ ] **1.9.1** — Criar `mobile/src/navigation/RootNavigator.tsx`
  - Monitora useAuthStore
  - Renderiza AuthNavigator ou ClientNavigator ou AdminNavigator
  
- [ ] **1.9.2** — Criar `mobile/src/navigation/AuthNavigator.tsx`
  - Stack: SplashScreen → LoginScreen → RegisterScreen
  
- [ ] **1.9.3** — Criar `mobile/src/navigation/ClientNavigator.tsx` (stub)
- [ ] **1.9.4** — Criar `mobile/src/navigation/AdminNavigator.tsx` (stub)
- [ ] **1.9.5** — Atualizar `mobile/App.tsx`
  - Usar NavigationContainer com RootNavigator

**Checklist:**
- [ ] App inicia com SplashScreen
- [ ] Login com CLIENT → ClientNavigator
- [ ] Login com ADMIN → AdminNavigator
- [ ] Logout → AuthNavigator

#### 1.10 — Testes Backend: Auth ⏳

- [ ] **1.10.1** — Criar `api/tests/auth.spec.ts`
  - Testes com Supertest + Jest
  - POST /register: sucesso, email duplicado, password fraco
  - POST /login: credenciais corretas, credenciais erradas
  - POST /refresh: token válido, token expirado

**Checklist:**
- [ ] Todos os testes passam
- [ ] Coverage >= 80%

#### 1.11 — E2E Básico ⏳

- [ ] **1.11.1** — Criar cenário E2E
  - App inicia → Splash → Login → Register de novo user → Login automático → Home visível

**Checklist:**
- [ ] Fluxo testado manualmente

---

## Próximas Fases (Roadmap)

### Sprint 2: Cardápio, Carrinho e Pedidos

**Quando:** Após Sprint 1 completo  
**Duração:** 1 semana  
**Tasks principais:**
- Mongoose schemas para produtos
- Menu service com Redis cache
- Carrinho Zustand
- Tela de menu + busca + filtros
- Carrinho UI
- Criação de pedidos

### Sprint 3: Pagamento, Admin e Estoque

**Quando:** Após Sprint 2 completo  
**Duração:** 1 semana  
**Tasks principais:**
- Stripe integration (checkout + webhook)
- Admin painel com Kanban de pedidos
- Gestão de estoque
- Real-time updates com WebSocket (opcional)

---

## Arquivos Principais por Fase

### Fase 0
- .gitignore ✅
- README.md ✅
- api/package.json ✅
- mobile/package.json ✅
- api/tsconfig.json ✅
- mobile/tsconfig.json ✅
- api/.eslintrc.json ✅
- mobile/.eslintrc.json ✅
- .github/workflows/api-ci.yml ✅
- .github/workflows/mobile-ci.yml ✅
- api/.env ✅
- mobile/.env ✅
- api/prisma/schema.prisma ✅

### Sprint 1 (Em Progresso)
- api/src/modules/auth/auth.schema.ts ⏳
- api/src/modules/auth/auth.service.ts ⏳
- api/src/modules/auth/auth.controller.ts ⏳
- api/src/utils/jwt.ts ⏳
- api/src/middleware/auth.middleware.ts ⏳
- api/src/middleware/role.middleware.ts ⏳
- api/src/middleware/validate.middleware.ts ⏳
- api/src/routes/auth.routes.ts ⏳
- api/src/config/database.ts ⏳
- mobile/src/stores/auth.store.ts ⏳
- mobile/src/api/axios.ts ⏳
- mobile/src/screens/SplashScreen.tsx ⏳
- mobile/src/screens/LoginScreen.tsx ⏳
- mobile/src/screens/RegisterScreen.tsx ⏳
- mobile/src/navigation/RootNavigator.tsx ⏳
- api/tests/auth.spec.ts ⏳

---

## Sumário de Tecnologias Utilizadas

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Backend Runtime | Node.js | 22 LTS |
| Backend Framework | Express | 5.x |
| Linguagem | TypeScript | 5.3+ |
| ORM Relacional | Prisma | 5.8.0 |
| ODM Documentos | Mongoose | 8.0.3 |
| Cache | ioredis | 5.3.2 |
| Autenticação | JWT + bcrypt | 9.1.2 / 5.1.1 |
| Validação | Zod | 3.22.4 |
| Frontend Mobile | Expo | SDK 51+ |
| UI Framework | React Native | 0.73.1 |
| Navegação | React Navigation | v7 |
| Estado Global | Zustand | 4.4.1 |
| Server State | TanStack Query | v5 |
| Formulários | React Hook Form | 7.51.0 |
| HTTP Client | Axios | 1.6.5 |
| Pagamento | Stripe | latest |
| Banco PostgreSQL | Supabase | Free |
| Banco MongoDB | Atlas | Free |
| Cache Redis | Upstash | Free |
| File Storage | Cloudflare R2 | Free |
| Hospedagem API | Render | Free/Hobby |
| CI/CD | GitHub Actions | Native |

---

## Matriz de Dependências

```
Fase 0 (Completa)
├── 0.1: Repositório ✅
├── 0.2: Cloud Services ✅
├── 0.3: CI/CD Pipelines ✅
├── 0.4: TypeScript/ESLint ✅
└── 0.5: Databases ✅
    └── Sprint 1 (Iniciando) ⏳
        ├── 1.1: Prisma Schema ⏳
        ├── 1.2: Auth Service ⏳
        ├── 1.3: Auth Middleware ⏳
        ├── 1.4: Express Setup ⏳
        ├── 1.5: Expo Setup ⏳
        ├── 1.6: Auth Store ⏳
        ├── 1.7: Axios Config ⏳
        ├── 1.8: Auth Screens ⏳
        ├── 1.9: Navigation ⏳
        ├── 1.10: Tests ⏳
        └── 1.11: E2E ⏳
            └── Sprint 2 (Proximamente)
                └── Sprint 3 (Proximamente)
```

---

## Desafios Conhecidos

1. **SSH Keys**: Resolvido → Usando HTTPS em vez de SSH para git
2. **Credenciais sensíveis**: Armazenadas em `.env.local` (não em versionamento)
3. **Cross-DB References**: Order IDs migram entre PostgreSQL e MongoDB
4. **Real-time Updates**: WebSocket pode ser necessário após Sprint 2

---

## Próximas Ações Imediatas

- [ ] Iniciar Sprint 1 com implementação de config/database.ts
- [ ] Criar auth.schema.ts com schemas Zod
- [ ] Implementar auth.service.ts
- [ ] Implementar middlewares de auth
- [ ] Criar rotas de autenticação
- [ ] Testar endpoints localmente
- [ ] Paralelo: Setup Zustand auth store no mobile
- [ ] Paralelo: Setup Axios interceptors
- [ ] Paralelo: Criar telas de autenticação mobile
