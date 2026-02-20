# ===========================================================
# Backend Dockerfile — PRODUÇÃO
# Multi-stage build com Gunicorn + Uvicorn workers
# Otimizado para escala enterprise (milhões de devices)
# ===========================================================

# --- Stage 1: Dependencies ---
FROM python:3.12-slim AS deps

WORKDIR /app

# Instalar dependências do sistema necessárias para compilação
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# --- Stage 2: Production ---
FROM python:3.12-slim

# Metadados
LABEL maintainer="rjsolucoes"
LABEL description="RJChronosConnect Backend API"

# Dependências de runtime
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Variáveis de ambiente para produção
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    # Gunicorn config
    GUNICORN_WORKERS=4 \
    GUNICORN_THREADS=2 \
    GUNICORN_TIMEOUT=120 \
    GUNICORN_KEEPALIVE=5 \
    GUNICORN_MAX_REQUESTS=10000 \
    GUNICORN_MAX_REQUESTS_JITTER=1000

# Copiar dependências instaladas
COPY --from=deps /install /usr/local

# Criar usuário não-root
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

WORKDIR /app
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -sf http://localhost:8000/health || exit 1

# Gunicorn com Uvicorn workers para máxima performance
# - workers: processos independentes (scale up baseado em cores)
# - max-requests: recicla workers para evitar memory leaks
# - graceful-timeout: shutdown limpo sem perder requests
CMD gunicorn app.main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers ${GUNICORN_WORKERS} \
    --threads ${GUNICORN_THREADS} \
    --timeout ${GUNICORN_TIMEOUT} \
    --keep-alive ${GUNICORN_KEEPALIVE} \
    --max-requests ${GUNICORN_MAX_REQUESTS} \
    --max-requests-jitter ${GUNICORN_MAX_REQUESTS_JITTER} \
    --graceful-timeout 30 \
    --bind 0.0.0.0:8000 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
