# 📖 Monorepo Dictionary

Monorepo com **pnpm** e **Turborepo** contendo dois apps:

| App     | Stack                                                   | Porta |
| ------- | ------------------------------------------------------- | ----- |
| `front` | Next.js 15, React 19, TypeScript, Tailwind v4, Zustand, React Query, Zod | 3000  |
| `api`   | Node.js, Express, PostgreSQL, TypeScript, Zod           | 3001  |

---

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10+
- [Docker](https://www.docker.com/) e Docker Compose (para deploy e banco de dados)

---

## 🚀 Instalação

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
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

Edite o arquivo `.env` conforme necessário.

---

## 💻 Desenvolvimento

### Subir o banco de dados (PostgreSQL via Docker)

```bash
docker compose up postgres -d
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

### Acessar os apps

- **Front**: [http://localhost:3000](http://localhost:3000)
- **API Health Check**: [http://localhost:3001/health](http://localhost:3001/health)

---

## 🐳 Docker (Deploy)

### Subir todos os serviços (front + api + postgres)

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
│   ├── front/              # Next.js 15 App Router
│   │   ├── src/app/        # App Router pages e layouts
│   │   ├── Dockerfile
│   │   └── package.json
│   └── api/                # Node.js + Express + PostgreSQL
│       ├── src/            # Source code
│       ├── Dockerfile
│       └── package.json
├── packages/               # Pacotes compartilhados (futuro)
├── docker-compose.yml      # Orquestração Docker
├── turbo.json              # Configuração Turborepo
├── pnpm-workspace.yaml     # Workspaces pnpm
├── .env.example            # Template de variáveis de ambiente
└── package.json            # Root package
```

---

## 🛠 Scripts Disponíveis

| Comando            | Descrição                              |
| ------------------ | -------------------------------------- |
| `pnpm dev`         | Roda todos os apps em desenvolvimento  |
| `pnpm build`       | Builda todos os apps                   |
| `pnpm lint`        | Roda lint em todos os apps             |
| `pnpm dev:front`   | Roda apenas o front                    |
| `pnpm dev:api`     | Roda apenas a API                      |
| `pnpm build:front` | Builda apenas o front                  |
| `pnpm build:api`   | Builda apenas a API                    |

---

## 📦 Tecnologias

- **Monorepo**: pnpm Workspaces + Turborepo
- **Front**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand, React Query, Zod
- **API**: Node.js, Express, PostgreSQL (pg), TypeScript, Zod
- **Infra**: Docker, Docker Compose
