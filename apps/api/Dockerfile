# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy api package (including utils for seed)
COPY apps/api/ ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the api
RUN pnpm build --filter=@dictionary/api

# ---- Stage 2: Production ----
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built output and production deps
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/node_modules ./node_modules

# Copy utils (words_dictionary.json needed for seed)
COPY --from=builder /app/apps/api/utils ./utils

# Copy entrypoint script
COPY apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV NODE_ENV=production
ENV API_PORT=3001

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
