# --- Stage 1: Build frontend assets with Bun ---
FROM oven/bun:latest AS frontend-build

WORKDIR /app/frontend

COPY services/frontend/package.json ./
RUN bun install

COPY services/frontend ./
RUN bun run build

# --- Stage 2: Build Edge runtime ---
FROM oven/bun:latest

WORKDIR /app

COPY services/edge/package.json ./
RUN bun install --production

COPY services/edge ./
COPY --from=frontend-build /app/frontend/dist ./public

ENV NODE_ENV=production
EXPOSE 8081

CMD ["bun", "src/index.ts"]
