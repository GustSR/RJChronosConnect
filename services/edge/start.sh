#!/bin/bash
set -e

echo "🚀 Iniciando Edge Gateway..."

# --- Migrations do Better Auth ---
if [ -n "$BETTER_AUTH_DATABASE_URL" ]; then
    MAX_RETRIES=10
    COUNT=0
    while [ $COUNT -lt $MAX_RETRIES ]; do
        echo "🔄 Tentativa de migração Better Auth ($((COUNT+1))/$MAX_RETRIES)..."
        if psql "$BETTER_AUTH_DATABASE_URL" -f /app/migrations/better-auth.sql 2>&1; then
            echo "✅ Migrações Better Auth aplicadas com sucesso!"
            break
        fi
        echo "⚠️ Falha na migração. Tentando novamente em 5 segundos..."
        sleep 5
        COUNT=$((COUNT+1))
    done

    if [ $COUNT -eq $MAX_RETRIES ]; then
        echo "❌ Falha crítica: Não foi possível aplicar migrações Better Auth após $MAX_RETRIES tentativas."
    fi
else
    echo "⚠️ BETTER_AUTH_DATABASE_URL não definida, pulando migrações."
fi

# --- Inicia o Edge ---
if [ "$NODE_ENV" = "production" ]; then
    echo "🔥 Iniciando Bun (produção)..."
    exec bun src/index.ts
else
    echo "🔥 Iniciando Bun (desenvolvimento com --hot)..."
    exec bun --hot src/index.ts
fi
