# Sprint 1: Autenticação e Fundações — Status Completo

> **Data de Conclusão:** 8 de abril de 2026  
> **Status:** 100% Completo ✅  
> **Próxima Sprint:** Sprint 2 — Cardápio, Carrinho e Pedidos

---

## Resumo Executivo

O Sprint 1 foi implementado com sucesso, estabelecendo toda a infraestrutura de autenticação que servirá como base para os próximos sprints. O sistema suporta registro, login e gerenciamento de sessões via JWT com auto-refresh de tokens.

---

## Tarefas Completadas

### Backend — Express + TypeScript + Prisma

#### 1.1 Prisma Schema & Migrations ✅

- [x] **config/database.ts** — Conecta Prisma, Mongoose e Redis
  - Gerencia conexões com fallback gracioso
  - Suporta graceful shutdown em SIGTERM/SIGINT

- [x] **prisma/schema.prisma** — Schema completo para User, Order, OrderItem, Stock, Payment
  - Enums: Role (CLIENT/ADMIN), OrderStatus (6 estados), StockStatus
  - Relacionamentos: Order → User, OrderItem → Order, Payment → Order

#### 1.2 Auth Service ✅

**auth.service.ts**
- [x] `register(dto)`: Registra novo usuário com senha hasheada via bcrypt
- [x] `login(dto)`: Autentica com email/password
- [x] `refreshToken()`: Renova access token via refresh token armazenado em Redis
- [x] `logout(userId)`: Remove session do Redis

**auth.schema.ts**
- [x] RegisterSchema: Zod com validações de força de senha
- [x] LoginSchema: Email + password
- [x] RefreshSchema: Refresh token

**jwt.ts**
- [x] `signAccessToken()`: JWT 15min com userId, email, role
- [x] `signRefreshToken()`: JWT 7d com userId
- [x] `verifyAccessToken()`: Valida e decodifica access token
- [x] `verifyRefreshToken()`: Valida refresh token

#### 1.3 Middleware ✅

**auth.middleware.ts**
- [x] Extrai Bearer token do Authorization header
- [x] Valida JWT com verifyAccessToken()
- [x] Anexa req.user com {id, email, role}
- [x] Retorna 401 se inválido/expirado
- [x] Suporta middleware opcional

**role.middleware.ts**
- [x] Valida req.user.role contra lista de roles permitidas
- [x] Retorna 403 se não autorizado

**validate.middleware.ts**
- [x] Factory que aceita schema Zod
- [x] Valida req.body e retorna 400 com erros formatados

#### 1.4 Express Routes ✅

**routes/auth.routes.ts**
- [x] POST /api/v1/auth/register — Sem guard, com validação Zod
- [x] POST /api/v1/auth/login — Sem guard, com validação
- [x] POST /api/v1/auth/refresh — Com auth guard
- [x] POST /api/v1/auth/logout — Com auth guard

**app.ts & index.ts**
- [x] Registra authRouter com rate limiting (20 req/15min)
- [x] Conecta BDs ao iniciar servidor
- [x] Graceful shutdown com SIGTERM/SIGINT
- [x] Health check em GET /health

#### 1.10 Testes Backend ✅

**tests/auth.spec.ts** — Jest + Supertest
- [x] Registro com dados válidos
- [x] Rejeição de email duplicado
- [x] Rejeição de senha fraca
- [x] Login com credenciais corretas
- [x] Rejeição de credenciais erradas
- [x] Refresh token com sucesso
- [x] Rejeição de refresh inválido
- [x] Logout funcional
- [x] Health check

**Coverage:** Todos os endpoints de auth testados

---

### Mobile — React Native + Expo + Zustand

#### 1.5 Expo Setup ✅

- [x] **app.json** — Config Expo com info do app, splashscreen, plugins
- [x] **app.config.ts** — Variáveis de ambiente públicas (API_BASE_URL, Stripe PK)
- [x] **eas.json** — Build profiles (preview, production)
- [x] **babel.config.js** — Preset expo + react-native-reanimated

#### 1.6 Auth Store ✅

**stores/auth.store.ts** — Zustand com persistência AsyncStorage
- [x] Interface User (id, name, email, role)
- [x] Interface AuthState com user, tokens, isAuthenticated, isLoading, error
- [x] Actions: setAuth, updateAccessToken, setError, setLoading, clearAuth
- [x] Persistência em AsyncStorage com partialize

#### 1.7 Axios Config ✅

**api/axios.ts**
- [x] Instância com baseURL para API
- [x] Request interceptor injeta Bearer token
- [x] Response interceptor trata 401
- [x] Auto-refresh: detecta token expirado, usa refresh_token, retorna requisição
- [x] Fila de requisições durante refresh para evitar race conditions

**types/auth.ts** — Schemas Zod
- [x] RegisterSchema com validações de senha
- [x] LoginSchema
- [x] Tipagem TypeScript para inputs

#### 1.8 Auth Screens ✅

**screens/SplashScreen.tsx**
- [x] Logo + loading animation
- [x] Verifica token no store
- [x] Redireciona para Login ou Home baseado em isAuthenticated

**screens/LoginScreen.tsx**
- [x] Form com email + password via React Hook Form
- [x] Validação Zod integrada
- [x] Loading state durante requisição
- [x] Chamada para POST /api/v1/auth/login
- [x] Salva tokens no Zustand store
- [x] Navega para Home ou pausa em erro
- [x] Link para Register

**screens/RegisterScreen.tsx**
- [x] Form com name, email, phone (opcional), password, passwordConfirm
- [x] Validação Zod com confirmação de senhas
- [x] Chamada para POST /api/v1/auth/register
- [x] Auto-login após cadastro bem-sucedido
- [x] Link para Login

#### 1.9 Navigation ✅

**navigation/RootNavigator.tsx**
- [x] Monitora useAuthStore (isAuthenticated, user.role)
- [x] Renderiza condicional: AuthNavigator | ClientNavigator | AdminNavigator
- [x] NavigationContainer wrapper

**navigation/AuthNavigator.tsx**
- [x] Stack: SplashScreen → LoginScreen → RegisterScreen
- [x] Sem header, apenas navegação

**navigation/ClientNavigator.tsx** (Stub para Sprint 2)
- [x] Bottom Tab Navigator com 3 abas
- [x] Tabs: Cardápio, Pedidos, Perfil
- [x] Botão logout na aba Perfil

**navigation/AdminNavigator.tsx** (Stub para Sprint 3)
- [x] Drawer Navigator com 3 telas
- [x] Drawers: Dashboard, Estoque, Perfil
- [x] Botão logout no Perfil

**App.tsx**
- [x] Integra expo-splash-screen
- [x] Renderiza RootNavigator

---

## Arquivos Criados

### Backend
```
api/
├── src/
│   ├── config/
│   │   └── database.ts (150 linhas)
│   ├── middleware/
│   │   ├── auth.middleware.ts (60 linhas)
│   │   ├── role.middleware.ts (25 linhas)
│   │   └── validate.middleware.ts (25 linhas)
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.schema.ts (35 linhas)
│   │       ├── auth.service.ts (150 linhas)
│   │       └── auth.controller.ts (90 linhas)
│   ├── routes/
│   │   └── auth.routes.ts (40 linhas)
│   ├── utils/
│   │   └── jwt.ts (65 linhas)
│   ├── app.ts (45 linhas - atualizado)
│   └── index.ts (45 linhas - atualizado)
└── tests/
    └── auth.spec.ts (250 linhas)

Total Backend: ~900 linhas
```

### Mobile
```
mobile/
├── src/
│   ├── api/
│   │   └── axios.ts (110 linhas)
│   ├── navigation/
│   │   ├── RootNavigator.tsx (25 linhas)
│   │   ├── AuthNavigator.tsx (35 linhas)
│   │   ├── ClientNavigator.tsx (110 linhas)
│   │   └── AdminNavigator.tsx (110 linhas)
│   ├── screens/
│   │   ├── SplashScreen.tsx (55 linhas)
│   │   ├── LoginScreen.tsx (200 linhas)
│   │   └── RegisterScreen.tsx (280 linhas)
│   ├── stores/
│   │   └── auth.store.ts (70 linhas)
│   └── types/
│       └── auth.ts (30 linhas)
└── App.tsx (25 linhas - atualizado)

Total Mobile: ~1,100 linhas
```

---

## Fluxo de Autenticação

### Registro
```
1. User preenche form em RegisterScreen
   ↓
2. Validação Zod (schema: name, email, password, phone)
   ↓
3. POST /api/v1/auth/register com validateMiddleware
   ↓
4. authService.register():
   - Checker email duplicado
   - Hash password com bcrypt (10 salts)
   - Criar User no PostgreSQL
   - Gerar access + refresh tokens
   - Armazenar refresh_token em Redis (7d TTL)
   ↓
5. Retornar {user, access_token, refresh_token}
   ↓
6. Mobile salva em Zustand + AsyncStorage
   ↓
7. Auto-redirect para ClientNavigator
```

### Login
```
1. User preenche form em LoginScreen
   ↓
2. Validação Zod
   ↓
3. POST /api/v1/auth/login
   ↓
4. authService.login():
   - Buscar User por email
   - Comparar password com bcrypt
   - Se OK: gerar tokens
   - Se erro: retornar 400
   ↓
5. Mobile salva tokens
   ↓
6. Redirect baseado em role: ADMIN → AdminNavigator | CLIENT → ClientNavigator
```

### Token Refresh Automático
```
1. Mobile faz requisição com access_token expirado
   ↓
2. Axios interceptor detecta resposta 401
   ↓
3. Se refreshToken existe, fazer POST /api/v1/auth/refresh
   ↓
4. Backend:
   - Validar refresh token com JWT
   - Verificar se está em Redis
   - Se OK: gerar novos tokens
   - Se erro: retornar 401
   ↓
5. Mobile atualiza tokens no Zustand
   ↓
6. Retry requisição original com novo access_token
   ↓
7. Se tudo falhar: clearAuth() + logout
```

---

## Validações Implementadas

### Backend (Zod)
- Email válido
- Senha com min 8 caracteres, 1+ maiúscula, 1+ minúscula, 1+ número
- Telefone com regex básico
- Email único no banco

### Mobile (Zod)
- Mesmas validações do backend
- Confirmação de senhas match
- Tipos TypeScript derivados dos schemas

### HTTP
- 201 Success em registro
- 200 Success em login/refresh
- 400 Bad Request com array de erros Zod
- 401 Unauthorized em token expirado
- 403 Forbidden em role inválida
- 404 Not Found para rota desconhecida

---

## Segurança

- Senhas hasheadas com bcrypt (10 rounds)
- Access tokens: JWT 15min com HS256
- Refresh tokens: JWT 7d com senha separada, armazenados em Redis
- CORS configurado com origin branca
- Rate limiting: 20 req/15min para /auth, 100 req/15min geral
- Bearer token extração do Authorization header
- Graceful logout com remoção de Redis

---

## Próximos Passos — Sprint 2

1. **Backend Menu Service**
   - Mongoose schema para produtos
   - Redis cache com TTL 5min
   - Endpoints: GET /menu, GET /menu/:id, GET /menu/category/:cat

2. **Mobile Cart**
   - Zustand cart store
   - Persist cart em AsyncStorage
   - UI: Menu list + search + filtros + cart button

3. **Backend Orders**
   - POST /orders com items validados
   - Verificar stock em real-time
   - Retornar order com status PENDING

4. **Mobile Order Creation**
   - Form: endereço, observações, método de pagamento
   - Chamada POST /orders
   - Feedback de sucesso

---

## Comandos Úteis

```bash
# Backend
cd api
npm run dev                    # Inicia servidor em hot-reload
npm run type-check           # Valida tipos
npm run lint                 # Run ESLint
npm test                     # Testes com Jest
npm run prisma:migrate       # Migrações Prisma
npm run prisma:studio        # UI visual para BD

# Mobile
cd mobile
npm start                    # Inicia Expo
npm run android              # Abre em emulador Android
npm run ios                  # Abre em emulador iOS
npm run type-check          # Validação TypeScript
npm run lint                # ESLint
```

---

## Commits deste Sprint

```
- bd324d1: feat: Sprint 1.1-1.3 - Backend auth service, middleware e rotas
- 2e38ec2: feat: Sprint 1.6-1.9 - Mobile auth UI, stores e navigation
```

---

## Referências

- Architecture: [ARCHITECTURE.md](./.agent/ARCHITECTURE.md)
- Roadmap: [SCOPE.md](./.agent/SCOPE.md)
- Status: [CURRENT_PROJECT_STATUS.md](./.agent/CURRENT_PROJECT_STATUS.md)

---

**Sprint 1 concluído com sucesso! Sistema de autenticação pronto e testado. 🍝**
