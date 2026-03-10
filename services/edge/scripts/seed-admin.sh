#!/bin/bash
# Cria o usuário admin via API do Better Auth (sign-up endpoint)
# Uso: ./seed-admin.sh [BASE_URL]
# Exemplo: ./seed-admin.sh http://localhost:8081

BASE_URL="${1:-http://localhost:8081}"
AUTH_PATH="/api/auth/sign-up/email"

echo "📝 Criando usuário admin em ${BASE_URL}${AUTH_PATH}..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}${AUTH_PATH}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pedro Admin",
    "email": "pedro@chronos.com",
    "password": "phem0404"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Usuário admin criado com sucesso!"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
  echo "⚠️ Resposta HTTP $HTTP_CODE"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
fi
