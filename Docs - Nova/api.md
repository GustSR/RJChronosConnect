# Documentacao da API

Esta documentacao descreve a API principal do RJChronosConnect. Ela e exposta pelo servico `backend` e acessada via `edge`.

## 1. Visao geral

- API REST centralizada no servico `backend` (FastAPI).
- Acesso publico via edge em desenvolvimento.
- Retorno padrao em JSON.
- Integra com GenieACS e OLT managers para operacoes de campo.

## 2. Bases e URLs

- Base publica (dev): `http://localhost:8081/api`
- Base direta (dev): `http://localhost:8000/api`

Documentacao automatica do FastAPI:
- Swagger UI: `/docs`
- OpenAPI JSON: `/openapi.json`

Exemplo:
- `http://localhost:8000/docs`

## 3. Autenticacao

A autenticacao principal usa OAuth2 Password Flow.

### 3.1 Obter token

`POST /api/auth/token`

- Body: `application/x-www-form-urlencoded`
- Campos: `username` e `password`

Exemplo:

```bash
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=usuario@empresa.com&password=senha" \
  http://localhost:8000/api/auth/token
```

Resposta:

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

### 3.2 Usar token

Envie o header:

```
Authorization: Bearer <jwt>
```

`GET /api/auth/me` retorna o usuario autenticado.

## 4. Convencoes gerais

- Prefixo principal: `/api`.
- Endpoints internos usam `/internal` (uso de servicos).
- IDs variam por contexto:
  - `olt_id` e `onu_id` geralmente sao inteiros.
  - `device_id` (GenieACS) costuma ser string.
- Paginacao basica existe em `activity-history` com `limit` e `offset`.
- Erros seguem `HTTPException` do FastAPI com campo `detail`.

Status comuns:
- 400: dados invalidos.
- 401: nao autorizado.
- 404: recurso nao encontrado.
- 409: conflito (ex: ONU ja cadastrada).
- 500: erro interno.

## 5. Endpoints por dominio

### 5.1 Auth

- `POST /api/auth/token`
  - Gera token de acesso.
- `GET /api/auth/me`
  - Retorna dados do usuario autenticado.

### 5.2 Devices

- `GET /api/devices/cpes`
  - Lista CPEs do GenieACS.
- `GET /api/devices/onus`
  - Lista ONUs provisionadas/autorizadas pelo sistema.
- `GET /api/devices/olts`
  - Lista OLTs cadastradas no banco.
- `GET /api/devices/olts/{olt_id}/stats`
  - Estatisticas simples da OLT (online/offline) baseadas no banco.

### 5.3 Monitoring

- `GET /api/alerts`
  - Converte faults do GenieACS em alertas.
- `GET /api/dashboard/metrics`
  - Calcula metricas do dashboard a partir do GenieACS.
  - Se nao houver dados, usa fallback do banco.

### 5.4 Provisioning

- `GET /api/provisioning/pending`
  - Lista ONUs descobertas via autofind (OLT manager) ainda pendentes.
- `POST /api/provisioning/{onu_id}/authorize`
  - Autoriza e provisiona a ONU.
  - Integra GenieACS e OLT manager, cria registros locais quando necessario.
- `DELETE /api/provisioning/{onu_id}/reject`
  - Rejeita uma ONU pendente.
- `GET /api/provisioning/clients`
  - Lista clientes provisionados e seus dados basicos.
- `GET /api/provisioning/clients/{onu_id}`
  - Detalha configuracao de um cliente provisionado.
- `PUT /api/provisioning/clients/{onu_id}`
  - Atualiza configuracao de um cliente provisionado.

### 5.5 WiFi (GenieACS)

- `GET /api/wifi/configs`
  - Retorna configuracoes WiFi de todos os dispositivos.
- `GET /api/wifi/configs/{device_id}?band=2.4GHz`
  - Retorna configuracao WiFi de um dispositivo.
- `PUT /api/wifi/configs/{device_id}?band=2.4GHz`
  - Atualiza configuracao WiFi de um dispositivo.
- `POST /api/wifi/refresh/{device_id}`
  - Forca refresh das configuracoes WiFi.

### 5.6 Activity History

- `GET /api/activity-history/?device_id=&limit=&offset=`
  - Lista historico de atividades com filtros e paginacao.
- `GET /api/activity-history/{activity_id}`
  - Retorna um item especifico do historico.

### 5.7 OLT Management

- `GET /api/olts/`
  - Lista OLTs com filtros opcionais.
- `GET /api/olts/unconfigured`
  - Lista OLTs nao configuradas.
- `GET /api/olts/{olt_id}`
  - Detalha uma OLT.
- `POST /api/olts/`
  - Cria OLT manualmente.
- `PUT /api/olts/{olt_id}`
  - Atualiza OLT.
- `DELETE /api/olts/{olt_id}`
  - Remove OLT.
- `POST /api/olts/discover`
  - Descobre uma OLT por IP e credenciais.
- `POST /api/olts/discover/range`
  - Descobre OLTs em faixa de IP.
- `POST /api/olts/{olt_id}/setup`
  - Configura OLT para integracao.
- `POST /api/olts/setup/batch`
  - Configura OLTs em lote.
- `GET /api/olts/{olt_id}/logs`
  - Logs de configuracao de uma OLT.
- `GET /api/olts/logs/recent`
  - Logs recentes de configuracoes.
- `GET /api/olts/stats/overview`
  - Estatisticas gerais de OLTs.
- `GET /api/olts/{olt_id}/live`
  - Verifica alcance e dados basicos via OLT manager.

### 5.8 Internal (uso entre servicos)

- `GET /internal/olts/{olt_id}/credentials`
  - Retorna credenciais e dados de acesso da OLT.

## 6. Fluxos comuns (exemplos)

### 6.1 Login e consulta

1) `POST /api/auth/token`
2) `GET /api/auth/me`
3) `GET /api/devices/olts`

### 6.2 Provisionamento de ONU

1) `GET /api/provisioning/pending`
2) `POST /api/provisioning/{onu_id}/authorize`
3) `GET /api/provisioning/clients/{onu_id}`

### 6.3 Ajuste de WiFi

1) `GET /api/wifi/configs/{device_id}`
2) `PUT /api/wifi/configs/{device_id}`
3) `POST /api/wifi/refresh/{device_id}`

## 7. Observabilidade e logs

- O backend registra tempo de resposta e status das requisicoes.
- Atividades podem ser consultadas em `/api/activity-history`.

## 8. Proximos passos

- Documentar schemas de request/response por endpoint.
- Adicionar exemplos completos de payloads.
- Consolidar codigos de erro e mensagens padrao.
