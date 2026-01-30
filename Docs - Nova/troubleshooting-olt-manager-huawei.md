# Troubleshooting: olt-manager-huawei

Este guia lista problemas comuns e solucoes rapidas para o microservico olt-manager-huawei.

## Checklist rapido

- Verifique se o servico esta no ar e a porta correta no compose.
- Veja os logs: `docker-compose logs -f olt-manager-huawei`.
- Confira estatisticas do pool: `curl http://localhost:8000/pool-stats` (ajuste a porta se necessario).
- Revise variaveis de ambiente: `SNMP_COMMUNITY`, `SSH_POOL_*`, `RABBITMQ_*`, `TRAP_LISTENER_*`.

## Problemas comuns e solucoes

### 1) Timeout ou falha de conexao SSH com a OLT

Sinais comuns:
- Log: `Falha na conexao SSH ... Connection timeout`.

Acoes recomendadas:
- Validar IP, rota e credenciais da OLT.
- Ajustar `SSH_POOL_CONNECTION_TIMEOUT` se a OLT demora a responder.
- Habilitar log de sessao para debug: `NETMIKO_SESSION_LOG=true`.
- Reduzir `SSH_POOL_IDLE_TIMEOUT` se conexoes ficam presas no pool.

### 2) Pool de conexoes esgotado

Sinais comuns:
- `pool-stats` mostra muitas conexoes em uso ou poucas disponiveis.

Acoes recomendadas:
- Aumentar `SSH_POOL_MAX_SIZE`.
- Diminuir `SSH_POOL_IDLE_TIMEOUT`.

### 3) Parsing quebrado apos mudanca de firmware

Sinais comuns:
- Logs com `Parsing fallback usado` ou respostas vazias.

Acoes recomendadas:
- Ajustar regras de parsing em `services/olts-managers/olt-manager-huawei/src/core/parsers.py`.
- Validar o output do comando direto na OLT para atualizar regex/parsers.

### 4) Valores SNMP (opticos) incorretos

Sinais comuns:
- Potencia optica incoerente com a realidade.

Acoes recomendadas:
- Validar `scaling_factor` em `services/olts-managers/olt-manager-huawei/src/core/oid_mappings.py`.
- Comparar com CLI/SmartOLT e ajustar conversao.

### 5) Traps SNMP nao chegam

Sinais comuns:
- Sem eventos no RabbitMQ ou no backend.

Acoes recomendadas:
- Verificar `TRAP_LISTENER_HOST` e `TRAP_LISTENER_PORT`.
- Revisar configuracao SNMP na OLT (ver `services/olts-managers/olt-manager-huawei/trap-setup-commands.md`).
- Checar conectividade com o backend (o listener consulta o backend para resolver OLT).

### 6) Falha ao publicar em RabbitMQ

Sinais comuns:
- Log: `Falha ao conectar ao RabbitMQ`.

Acoes recomendadas:
- Conferir `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_DEFAULT_USER`, `RABBITMQ_DEFAULT_PASS`.
- Verificar se o container do RabbitMQ esta no ar e acessivel pela rede do compose.

## Comandos uteis

```bash
# Logs do servico
docker-compose logs -f olt-manager-huawei

# Estatisticas do pool (ajuste a porta se necessario)
curl http://localhost:8000/pool-stats

# Habilitar log de sessao Netmiko
export NETMIKO_SESSION_LOG=true
```
