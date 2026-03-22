# ──────────────────────────────
# Build stage: build frontend
# ──────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Install all dependencies
RUN npm install

# Copy source
COPY packages/ ./packages/
COPY apps/ ./apps/

# Build shared package
RUN npm run build:shared

# Build frontend
RUN npm run build:frontend

# ──────────────────────────────
# Production stage
# ──────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Install production deps only
RUN npm install --omit=dev -w apps/backend -w packages/shared

# Copy shared build
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy backend source (tsx runs TS directly)
COPY apps/backend/ ./apps/backend/

# Copy built frontend
COPY --from=builder /app/apps/frontend/dist ./apps/frontend/dist

# Create storage directory
RUN mkdir -p /app/bucket-storage

# Environment
ENV NODE_ENV=production
ENV PORT=3377
ENV STORAGE_PATH=/app/bucket-storage

EXPOSE 3377

CMD ["npx", "tsx", "apps/backend/src/index.ts"]
