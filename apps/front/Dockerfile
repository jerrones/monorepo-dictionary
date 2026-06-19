# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy front package
COPY apps/front/ ./apps/front/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the front
RUN pnpm build --filter=@dictionary/front

# ---- Stage 2: Production ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built output
COPY --from=builder /app/apps/front/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/front/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/front/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
