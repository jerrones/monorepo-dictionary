# 🏗️ Arquitetura — English Dictionary API

## Padrão Arquitetural

O projeto segue uma **Layered Architecture** (Arquitetura em Camadas), organizada da seguinte forma:

```
Request → Middlewares → Routes (Controllers) → Services/Utils → Database/Cache/External API
```

Cada camada tem uma responsabilidade clara e só se comunica com a camada imediatamente abaixo.

---

## Camadas

### 1. Middlewares (`src/middlewares/`)

| Middleware | Responsabilidade |
|-----------|-----------------|
| `auth.middleware.ts` | Valida token JWT, injeta `userId` e `userName` no request |
| `response-time.middleware.ts` | Adiciona header `x-response-time` em todas as respostas |
| `error-handler.middleware.ts` | Captura erros (Zod, genéricos) e retorna mensagens humanizadas |

### 2. Routes (`src/routes/`)

Camada de **controllers** — recebe requests, valida input via Zod schemas, executa lógica de negócio e retorna responses.

| Arquivo | Endpoints |
|---------|-----------|
| `auth.routes.ts` | `POST /auth/signup`, `POST /auth/signin` |
| `entries.routes.ts` | `GET /entries/en`, `GET /entries/en/:word`, `POST /entries/en/:word/favorite`, `DELETE /entries/en/:word/unfavorite` |
| `user.routes.ts` | `GET /user/me`, `GET /user/me/history`, `GET /user/me/favorites` |

### 3. Schemas (`src/schemas/`)

Validação de input com **Zod** — garante que os dados de entrada são válidos antes de chegar na lógica de negócio.

| Schema | Valida |
|--------|--------|
| `auth.schema.ts` | Signup (name, email, password) e Signin (email, password) |
| `pagination.schema.ts` | Query params de paginação (cursor, limit, search) |

### 4. Utils (`src/utils/`)

Funções utilitárias reutilizáveis.

| Util | Responsabilidade |
|------|-----------------|
| `pagination.ts` | Encode/decode de cursores base64, construção de respostas paginadas |
| `dictionary-api.ts` | Proxy para a Free Dictionary API (fetch externo) |

### 5. Infraestrutura (`src/`)

| Módulo | Responsabilidade |
|--------|-----------------|
| `db.ts` | Pool PostgreSQL lazy-initialized com função `query()` |
| `cache.ts` | Cliente Redis com funções `getCache()`, `setCache()`, `invalidateCache()` |
| `queue.ts` | Redis Pub/Sub para persistência assíncrona de favoritos |
| `openapi.ts` | Spec OpenAPI 3.0 servida via Swagger UI |

### 6. Database (`src/database/`)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `migrations.ts` | Criação de tabelas (users, words, favorites, history) |
| `seed.ts` | Importação de ~370k palavras do JSON para a tabela `words` |



## Estrutura de Diretórios

```
apps/api/
├── src/
│   ├── index.ts                         # Entry point — Express app + startup
│   ├── db.ts                            # Pool PostgreSQL (lazy)
│   ├── cache.ts                         # Cliente Redis (cache)
│   ├── queue.ts                         # Redis Pub/Sub (favoritos async)
│   ├── openapi.ts                       # Spec OpenAPI 3.0
│   ├── database/
│   │   ├── migrations.ts                # DDL — criação de tabelas
│   │   └── seed.ts                      # Import de palavras do JSON
│   ├── middlewares/
│   │   ├── auth.middleware.ts           # JWT verification
│   │   ├── response-time.middleware.ts  # Header x-response-time
│   │   └── error-handler.middleware.ts  # Error handler global
│   ├── schemas/
│   │   ├── auth.schema.ts              # Zod: signup/signin
│   │   └── pagination.schema.ts        # Zod: cursor pagination
│   ├── routes/
│   │   ├── auth.routes.ts              # POST /auth/*
│   │   ├── entries.routes.ts           # GET/POST/DELETE /entries/en/*
│   │   └── user.routes.ts              # GET /user/me/*
│   ├── utils/
│   │   ├── pagination.ts              # Cursor encode/decode + builder
│   │   └── dictionary-api.ts          # Proxy para dictionaryapi.dev
│   └── __tests__/
│       ├── pagination.test.ts          # Unit tests — pagination utils
│       ├── middleware.test.ts           # Unit tests — auth + error handler
│       ├── auth.test.ts                # Integration — auth routes
│       ├── entries.test.ts             # Integration — entries routes
│       └── user.test.ts                # Integration — user routes
├── utils/
│   └── words_dictionary.json            # ~370k palavras (source para seed)
├── Dockerfile                           # Multi-stage build
├── entrypoint.sh                        # Migrations + seed + start
├── vitest.config.ts                     # Config de testes
├── tsconfig.json                        # TypeScript config
└── package.json                         # Deps + scripts
```
