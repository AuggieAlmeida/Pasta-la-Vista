# 🍝 Pasta la Vista

> Aplicativo de delivery de comida com autenticação, cardápio dinâmico, pedidos e pagamento integrado.

## Stack Técnico

- **Backend:** Node.js + Express + TypeScript
- **Frontend Mobile:** React Native + Expo
- **Banco de Dados:** PostgreSQL (Supabase) + MongoDB + Redis
- **Pagamento:** Stripe
- **Storage:** Cloudflare R2
- **Deploy:** Railway

## Estrutura do Projeto

```
pasta-la-vista/
├── api/                    # Backend (Node.js/Express)
├── mobile/                 # Frontend Mobile (React Native/Expo)
├── .github/
│   └── workflows/          # CI/CD pipelines
└── docs/                   # Documentação adicional
```

## Desenvolvimento Local

### Requisitos

- Node.js 18+ / npm 9+
- Git

### Setup

```bash
# Clone o repositório
git clone git@github.com:AuggieAlmeida/Pasta-la-Vista.git
cd pasta-la-vista

# Instale dependências do backend
cd api && npm install && cd ..

# Instale dependências do mobile
cd mobile && npm install && cd ..
```

### Rodando o Projeto

**Backend:**
```bash
cd api
npm run dev
```

**Mobile:**
```bash
cd mobile
npm start
```

## Documentação

- [SCOPE.md](./.agent/SCOPE.md) — Roadmap detalhado com fases e sprints
- [ARCHITECTURE.md](./.agent/ARCHITECTURE.md) — Arquitetura técnica do sistema

## Status

- **Fase 0:** Setup & Infraestrutura — 🔄 em progresso
- **Sprint 1:** Autenticação e Fundações — ⬜ não iniciado
- **Sprint 2:** Cardápio, Carrinho e Pedidos — ⬜ não iniciado
- **Sprint 3:** Pagamento, Admin e Estoque — ⬜ não iniciado

## Autor

- Augusto Almeida @AuggieAlmeida
