# Troubleshooting: genieacs

Este guia lista problemas comuns e solucoes rapidas para o GenieACS (TR-069).

## Checklist rapido

- `docker-compose ps` para ver `genieacs` e `db-acs`.
- Logs do ACS: `docker-compose logs -f genieacs`.
- Variaveis essenciais: `GENIEACS_MONGODB_CONNECTION_URL`, `GENIEACS_REDIS_HOST`, `GENIEACS_UI_JWT_SECRET`, `GENIEACS_DEBUG_FILE`, `GENIEACS_DEBUG_FORMAT`.

## Problemas comuns e solucoes

### 1) IPs nao aparecem na UI

Sinais comuns:
- Dispositivo aparece, mas IP WAN/LAN vazio.

Acoes recomendadas:
- Forcar refresh via connection request (ajuste device_id):

```bash
curl -X POST "http://localhost:7557/devices/DEVICE_ID/tasks?connection_request" \
  -H "Content-Type: application/json" \
  -d '{"name":"refreshObject","objectName":"InternetGatewayDevice.WANDevice.1."}'
```

- Validar se os parametros existem na arvore do dispositivo.
- Se `WANIPConnection.2` nao existir, usar `WANIPConnection.1`.
- Para Huawei, tentar `Services.X_HUAWEI_WANRemoteAccess.IPAddress2`.

### 2) Dispositivo nao aparece no ACS

Sinais comuns:
- Nenhum CPE na lista de dispositivos.

Acoes recomendadas:
- Verificar se a porta TR-069 esta acessivel (7547 por padrao).
- Confirmar URL de ACS configurada no dispositivo.
- Checar logs do GenieACS para tentativas de conexao.

### 3) UI vazia ou dados nao persistem

Sinais comuns:
- UI sem historico ou parametros inconsistentes.

Acoes recomendadas:
- Validar `GENIEACS_MONGODB_CONNECTION_URL`.
- Verificar se o `db-acs` (MongoDB) esta no ar.

### 4) Integracao com backend falha

Sinais comuns:
- Backend nao consegue ler dispositivos ou aplicar configuracoes.

Acoes recomendadas:
- Confirmar `GENIACS_API_URL` no backend.
- Verificar logs do backend e do GenieACS.

## Comandos uteis

```bash
# Logs do GenieACS
docker-compose logs -f genieacs

# Verificar banco do ACS
docker-compose logs -f db-acs
```
