#!/bin/bash
set -e

# Função para aguardar o banco de dados
wait_for_db() {
    echo "⏳ Aguardando o banco de dados iniciar..."
    until nc -z db-app 5432; do
        echo "   ...aguardando db-app:5432"
        sleep 2
    done
    echo "✅ Banco de dados está acessível!"
}

# Aguarda o DB (requer netcat/nc instalado na imagem)
# Se não tiver nc, vamos tentar rodar o alembic num loop
echo "🚀 Iniciando script de startup..."

# Tenta rodar migrações. Se falhar, tenta de novo por alguns segundos (útil se o DB estiver subindo)
MAX_RETRIES=10
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
    echo "🔄 Tentativa de migração ($((COUNT+1))/$MAX_RETRIES)..."
    if alembic upgrade head; then
        echo "✅ Migrações aplicadas com sucesso!"
        break
    fi
    echo "⚠️ Falha na migração. Tentando novamente em 5 segundos..."
    sleep 5
    COUNT=$((COUNT+1))
done

if [ $COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Falha crítica: Não foi possível aplicar migrações após $MAX_RETRIES tentativas."
    # Não vamos sair com exit 1 para não crashar o container em loop infinito se for erro de código,
    # mas o app vai subir sem tabelas.
fi

# Inicia a aplicação
echo "🔥 Iniciando o servidor Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload