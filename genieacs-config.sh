#!/bin/bash

# Script para configurar GenieACS para aceitar simuladores sem autenticação

echo "Configurando GenieACS para aceitar simuladores..."

# Aguardar GenieACS estar disponível
sleep 10

# Configurar para não requerer autenticação
curl -X PUT "http://localhost:7557/config/cwmp.auth" \
  -H "Content-Type: application/json" \
  -d '"none"'

# Configurar interface CWMP
curl -X PUT "http://localhost:7557/config/cwmp.interface" \
  -H "Content-Type: application/json" \
  -d '"0.0.0.0"'

# Restart do GenieACS CWMP service
echo "Reiniciando serviço CWMP..."

echo "Configuração concluída!"