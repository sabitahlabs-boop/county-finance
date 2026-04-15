# County Finance — Production Dockerfile
# Multi-stage build for minimal image size

# ── Stage 1: Build ──
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (caching layer)
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Production ──
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy production dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm install --production --frozen-lockfile 2>/dev/null || npm install --production

# Copy built assets
COPY --from=builder /app/dist ./dist

# Security: non-root user
RUN addgroup --system --gid 1001 county && \
    adduser --system --uid 1001 county
USER county

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/index.js"]
