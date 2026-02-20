# ===========================================================
# Frontend Dockerfile — PRODUÇÃO
# Multi-stage build com Nginx otimizado para SPA
# ===========================================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar apenas arquivos de dependência primeiro (cache layer)
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps

# Copiar código fonte e buildar
COPY . .
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:stable-alpine

# Metadados
LABEL maintainer="rjsolucoes"
LABEL description="RJChronosConnect Frontend"

# Copiar configuração Nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
