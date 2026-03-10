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

RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

COPY services/edge/package.json ./
RUN bun install --production

COPY services/edge ./
COPY --from=frontend-build /app/frontend/dist ./public
RUN chmod +x start.sh

ENV NODE_ENV=production
EXPOSE 8081

CMD ["./start.sh"]
