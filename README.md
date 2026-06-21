# 📖 Monorepo Dictionary

Monorepo com **pnpm** e **Turborepo** contendo dois apps:

| App     | Stack                                                   | Porta |
| ------- | ------------------------------------------------------- | ----- |
| `front` | Next.js 15, React 19, TypeScript, Tailwind v4, Zustand, React Query, Zod | 3000  |
| `api`   | Node.js, Express 5, PostgreSQL, Redis, JWT, TypeScript, Zod | 3001  |

---

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10+
- [Docker](https://www.docker.com/) e Docker Compose (para banco de dados, cache e deploy)

---

## 🚀 Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/jerrones/monorepo-dictionary.git
cd monorepo-dictionary
```

### 2. Instalar dependências

```bash
pnpm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

---

## 💻 Desenvolvimento

### Subir banco de dados e cache (PostgreSQL + Redis via Docker)

```bash
docker compose up postgres redis -d
```

### Rodar todos os apps em modo desenvolvimento

```bash
pnpm dev
```

### Rodar apenas o front

```bash
pnpm dev:front
```

### Rodar apenas a API

```bash
pnpm dev:api
```

### Rodar migrations e seed da API

```bash
# Migrations (executadas automaticamente ao iniciar a API)
pnpm --filter @dictionary/api migrate

# Importar ~370k palavras para o banco
pnpm --filter @dictionary/api seed
```

### Acessar os apps

- **Front**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:3001](http://localhost:3001)
- **API Docs (Swagger)**: [http://localhost:3001/docs](http://localhost:3001/docs)
- **Health Check**: [http://localhost:3001/health](http://localhost:3001/health)

---

## 🧪 Testes

### Rodar testes da API

```bash
pnpm --filter @dictionary/api test
```

### Rodar em modo watch

```bash
pnpm --filter @dictionary/api test:watch
```

---

## 📚 Documentação da API

A documentação interativa está disponível via **Swagger UI** em [`/docs`](http://localhost:3001/docs) quando a API está rodando.

### Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `GET` | `/` | ❌ | Retorna `{ message: "English Dictionary" }` |
| `GET` | `/health` | ❌ | Health check da API |
| `POST` | `/auth/signup` | ❌ | Criar conta (retorna JWT) |
| `POST` | `/auth/signin` | ❌ | Login (retorna JWT) |
| `GET` | `/entries/en` | ✅ | Lista palavras (paginação por cursor + busca) |
| `GET` | `/entries/en/:word` | ✅ | Detalhes da palavra (proxy Dictionary API + cache) |
| `POST` | `/entries/en/:word/favorite` | ✅ | Favoritar palavra (async via Redis Pub/Sub) |
| `DELETE` | `/entries/en/:word/unfavorite` | ✅ | Desfavoritar palavra (async via Redis Pub/Sub) |
| `GET` | `/user/me` | ✅ | Perfil do usuário |
| `GET` | `/user/me/history` | ✅ | Histórico de palavras visitadas |
| `GET` | `/user/me/favorites` | ✅ | Lista de palavras favoritas |

### Headers de Cache

| Header | Valores | Descrição |
|--------|---------|-----------|
| `x-cache` | `HIT` / `MISS` | Indica se a resposta veio do cache Redis |
| `x-response-time` | `42ms` | Tempo de processamento da requisição |

---

## 🐳 Docker (Deploy)

### Subir todos os serviços (front + api + postgres + redis)

```bash
docker compose up --build
```

### Subir em modo detached (background)

```bash
docker compose up --build -d
```

### Parar todos os serviços

```bash
docker compose down
```

### Parar e remover volumes (reset do banco)

```bash
docker compose down -v
```

---

## 📁 Estrutura do Projeto

```
monorepo-dictionary/
├── apps/
│   ├── front/                     # Next.js 15 App Router
│   │   ├── src/app/               # App Router pages e layouts
│   │   ├── Dockerfile
│   │   └── package.json
│   └── api/                       # Node.js + Express 5 + PostgreSQL + Redis
│       ├── src/
│       │   ├── index.ts           # Entry point
│       │   ├── db.ts              # Pool PostgreSQL
│       │   ├── cache.ts           # Cliente Redis
│       │   ├── queue.ts           # Redis Pub/Sub (favoritos async)
│       │   ├── openapi.ts         # Spec OpenAPI 3.0
│       │   ├── database/          # Migrations + Seed
│       │   ├── middlewares/       # Auth JWT, Response-Time, Error Handler
│       │   ├── schemas/           # Validação Zod
│       │   ├── routes/            # Controllers (auth, entries, user)
│       │   ├── utils/             # Pagination, Dictionary API proxy
│       │   └── __tests__/         # Unit + Integration tests
│       ├── utils/
│       │   └── words_dictionary.json  # ~370k palavras
│       ├── Dockerfile
│       ├── entrypoint.sh
│       ├── vitest.config.ts
│       └── package.json
├── packages/                      # Pacotes compartilhados (futuro)
├── docker-compose.yml             # Orquestração Docker (postgres + redis + api + front)
├── turbo.json                     # Configuração Turborepo
├── pnpm-workspace.yaml            # Workspaces pnpm
├── ARCHITECTURE.md                # Documentação arquitetural
├── .env.example                   # Template de variáveis de ambiente
└── package.json                   # Root package
```

---

## 🛠 Scripts Disponíveis

| Comando | Descrição |
| ------- | --------- |
| `pnpm dev` | Roda todos os apps em desenvolvimento |
| `pnpm build` | Builda todos os apps |
| `pnpm lint` | Roda lint em todos os apps |
| `pnpm dev:front` | Roda apenas o front |
| `pnpm dev:api` | Roda apenas a API |
| `pnpm build:front` | Builda apenas o front |
| `pnpm build:api` | Builda apenas a API |
| `pnpm --filter @dictionary/api test` | Roda testes da API |
| `pnpm --filter @dictionary/api migrate` | Roda migrations |
| `pnpm --filter @dictionary/api seed` | Importa palavras do dicionário |

---

## 📦 Tecnologias

- **Monorepo**: pnpm Workspaces + Turborepo
- **Front**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand, React Query, Zod
- **API**: Node.js, Express 5, PostgreSQL (pg), Redis (ioredis), JWT, bcryptjs, TypeScript, Zod
- **Testes**: Vitest, Supertest
- **Documentação**: OpenAPI 3.0, Swagger UI
- **Infra**: Docker, Docker Compose
