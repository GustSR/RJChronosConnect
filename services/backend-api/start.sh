#!/bin/bash
set -e

# Executa as migrações do banco de dados
echo "🚀 Executando migrações do banco de dados..."
alembic upgrade head

# Inicia a aplicação
echo "🔥 Iniciando o servidor Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
