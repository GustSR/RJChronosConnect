#!/bin/bash

# Este script é usado para iniciar os serviços do GenieACS com variáveis de ambiente.
# Ele é chamado pelo Dockerfile.

# Definir variáveis de ambiente padrão
export GENIEACS_MONGODB_CONNECTION_URL=${GENIEACS_MONGODB_CONNECTION_URL:-mongodb://localhost:27017/genieacs}
export GENIEACS_REDIS_HOST=${GENIEACS_REDIS_HOST:-localhost}
export GENIEACS_UI_JWT_SECRET=${GENIEACS_UI_JWT_SECRET:-changeme-super-secret-key-12345}

# Caminho para o arquivo de configuração do supervisor
SUPERVISOR_CONF="/etc/supervisor/conf.d/genieacs.conf"

# Substituir as variáveis no arquivo de configuração do supervisor
# Isso é necessário porque o supervisor não expande variáveis de ambiente definidas externamente por padrão
sed -i "s|%(ENV_GENIEACS_MONGODB_CONNECTION_URL)s|$GENIEACS_MONGODB_CONNECTION_URL|g" "$SUPERVISOR_CONF"
sed -i "s|%(ENV_GENIEACS_REDIS_HOST)s|$GENIEACS_REDIS_HOST|g" "$SUPERVISOR_CONF"
sed -i "s|%(ENV_GENIEACS_UI_JWT_SECRET)s|$GENIEACS_UI_JWT_SECRET|g" "$SUPERVISOR_CONF"

# Iniciar o supervisor
exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf