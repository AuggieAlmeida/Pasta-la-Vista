# Fase 0: Setup & Infraestrutura — Checklist de Progresso

> **Status:** ✅ 80% Completo (Estrutura + Configuração local)  
> **Data de Início:** 7 de abril de 2026  
> **Próximas Ações:** Conectar serviços cloud, setup variáveis de ambiente

---

## ✅ Completado — Tarefas 0.1 e 0.4 (Estrutura & TypeScript/ESLint)

### 0.1 — Repositório e Estrutura Local

- [x] **0.1.1** — Monorepo GitHub criado (`pasta-la-vista`)
  - `.gitignore` completo com node_modules, .env, .expo/, dist/, etc.
  - Branch `main` inicializado e pronto para commits
  
- [x] **0.1.2** — Pastas base `/api` e `/mobile` configuradas
  - `api/package.json` com scripts: `dev`, `build`, `start`, `lint`, `type-check`, `test`, prisma commands
  - `mobile/package.json` com scripts: `start`, `android`, `ios`, `build`, `lint`, `type-check`
  
- [x] **0.1.3** — `.env.example` criados em ambos os diretórios
  - `api/.env.example` com variáveis de: BD's, JWT, Stripe, R2, Email, CORS
  - `mobile/.env.example` com variáveis públicas (API URL, Stripe PK)

**Acceptance Criteria:** ✅  
- ✅ Repositório público no GitHub (URL: https://github.com/AuggieAlmeida/Pasta-la-Vista)
- ✅ `git clone` + instalar deps não gera erros estruturais
- ✅ Primeiro commit feito com sucesso

---

### 0.4 — TypeScript & Linting Config

#### API

- [x] **0.4.1** — `api/tsconfig.json`
  - strict mode ativado: `strictNullChecks`, `noImplicitAny`, `esModuleInterop`
  - Module resolution: ESNext, target: ES2020
  
- [x] **0.4.2** — `api/.eslintrc.json`
  - Parser: `@typescript-eslint/parser`
  - Rules: `@typescript-eslint` com recomendações
  
- [x] **0.4.3** — Scripts configurados em `api/package.json`

#### Mobile

- [x] **0.4.4** — `mobile/tsconfig.json` (Expo preset)
  - Baseado no `expo/tsconfig`, strict mode ativado
  
- [x] **0.4.5** — `mobile/.eslintrc.json` com plugins
  - Plugins: `react-hooks`, `react-native`, `@typescript-eslint`
  
- [x] **0.4.6** — `mobile/babel.config.js`
  - Preset: `babel-preset-expo`
  - Plugin: `react-native-reanimated/plugin`
  
- [x] **0.4.7** — Scripts configurados em `mobile/package.json`

**Acceptance Criteria:** ✅  
- ✅ Configs de TS/ESLint prontos nos dois workspaces
- ✅ Estrutura de projeto organizada

---

## 🔄 Em Progresso — Tarefas 0.3 (CI/CD partial)

### 0.3 — CI/CD Pipeline (GitHub Actions)

- [x] **0.3.1** — `.github/workflows/api-ci.yml`
  - Triggers: Push em `main`/`develop`, PRs, paths `api/**`
  - Jobs: `lint` → `type-check` → `test` → `build` → `deploy` (if main)
  - Deploy: Railway token (stub, precisa `RAILWAY_TOKEN` secret)
  
- [x] **0.3.2** — `.github/workflows/mobile-ci.yml`
  - Triggers: Push em `main`/`develop`, PRs, paths `mobile/**`
  - Jobs: `lint` → `type-check` → `build-preview`
  - Build: EAS preview (stub, precisa `EXPO_TOKEN` secret)

**Próximos Passos:**
- [ ] Adicionar secrets no GitHub Actions:  
  - `RAILWAY_TOKEN` (para deploy da API)
  - `EXPO_TOKEN` (para builds do mobile)
  - Database URLs (DATABASE_URL, MONGODB_URI, REDIS_URL)
  - Stripe keys
  - Etc.

---

## ⬜ Não Iniciado — Tarefas 0.2 e 0.5 (Cloud & BD)

### 0.2 — Contas e Credenciais Cloud

**Serviços a Provisionar:**

| Serviço | Status | Ação |
|---------|--------|------|
| Railway | ⬜ | Criar conta, gerar token |
| Supabase | ⬜ | Criar DB PostgreSQL, copiar DATABASE_URL |
| MongoDB Atlas | ⬜ | Criar cluster, copiar MONGODB_URI |
| Upstash Redis | ⬜ | Criar DB, copiar REDIS_URL |
| Cloudflare R2 | ⬜ | Configurar bucket, keys |
| Stripe | ⬜ | Account test mode, keys |
| Expo | ⬜ | Gerar EXPO_TOKEN |

**Tasks:**
- [ ] **0.2.1** — Criar contas em todos os serviços e testar conectividade
- [ ] **0.2.2** — Documentar connection strings em `.env.example`
- [ ] **0.2.3** — Adicionar GitHub Secrets

---

### 0.5 — Base de Dados — Setup Inicial

- [ ] **0.5.1** — Criar banco PostgreSQL `pastalavista_dev` no Supabase
- [ ] **0.5.2** — Copiar `DATABASE_URL` para `.env.local` (API)
- [ ] **0.5.3** — Criar cluster MongoDB `pastalavista_dev` no Atlas
- [ ] **0.5.4** — Copiar `MONGODB_URI` para `.env.local`
- [ ] **0.5.5** — Criar DB Redis no Upstash
- [ ] **0.5.6** — Copiar `REDIS_URL` para `.env.local`

**Acceptance Criteria:**
- [ ] Testes de conexão bem-sucedidos em cada BD

---

## 📊 Estrutura de Diretórios Criada

```
pasta-la-vista/
├── .github/
│   └── workflows/
│       ├── api-ci.yml           ✅
│       └── mobile-ci.yml        ✅
├── api/
│   ├── src/
│   │   ├── index.ts             ✅ (entry point)
│   │   ├── app.ts               ✅ (Express app setup)
│   │   ├── middleware/          📁
│   │   ├── modules/
│   │   │   ├── auth/            📁
│   │   │   └── menu/            📁
│   │   ├── routes/              📁
│   │   ├── utils/               📁
│   │   └── types/               📁
│   ├── tests/                   📁
│   ├── prisma/
│   │   └── schema.prisma        ✅
│   ├── package.json             ✅
│   ├── tsconfig.json            ✅
│   ├── .eslintrc.json           ✅
│   ├── jest.config.js           ✅
│   └── .env.example             ✅
├── mobile/
│   ├── src/
│   │   ├── screens/             📁
│   │   ├── navigation/          📁
│   │   ├── stores/              📁
│   │   ├── api/                 📁
│   │   ├── components/          📁
│   │   ├── utils/               📁
│   │   └── types/               📁
│   ├── assets/                  📁
│   ├── App.tsx                  ✅
│   ├── app.json                 ✅
│   ├── app.config.ts            ✅
│   ├── babel.config.js          ✅
│   ├── eas.json                 ✅
│   ├── package.json             ✅
│   ├── tsconfig.json            ✅
│   ├── .eslintrc.json           ✅
│   └── .env.example             ✅
├── .gitignore                   ✅
├── README.md                    ✅
└── SCOPE.md                     ✅ (referência)
```

---

## 🚀 Próximas Fases

### Sprint 1: Autenticação e Fundações

**Quando:** Assim que 0.2 e 0.5 terminarem (≈ 1 semana)  
**Duração:** 1 semana  
**Tasks principais:**
- Setup Prisma migrations
- Auth service (register, login, refresh, logout)
- Auth middleware (JWT, role-based access)
- Express app setup
- Expo app initialization
- Auth stores (Zustand)
- Auth screens (Login, Register, Splash)
- Navigation stacks
- Unit tests

---

## 📝 Desafios Identificados

1. **SSH Keys:** Problema de autenticação SSH → Resolvido com HTTPS
2. **Secrets do GitHub:** CI/CD pipelines precisarão de tokens e credenciais
3. **Local Development:** Usuários precisarão copiar `.env.example` → `.env.local` após clone

---

## ✅ Checklist Final — Fase 0

- ✅ Repositório GitHub criado e primeira `push` feita
- ✅ Estrutura monorepo com `/api` e `/mobile`
- ✅ TypeScript + ESLint configurados
- ✅ CI/CD pipelines (GitHub Actions) preparados
- ✅ `package.json` com scripts essenciais
- ✅ Prisma schema pronto
- ✅ `.env.example` documentados
- ✅ README com documentação básica
- ⏳ **Aguardando:** Cloud setup (0.2 & 0.5)

---

**Resumo:** A infraestrutura base foi criada com sucesso! Agora é necessário provisionar os serviços em cloud (Supabase, MongoDB, Redis, etc.) e adicionar os secrets ao GitHub Actions para completar a Fase 0.
