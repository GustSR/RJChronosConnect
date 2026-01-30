# Troubleshooting: backend

Este guia lista problemas comuns e solucoes rapidas para o servico backend (FastAPI).

## Checklist rapido

- `docker-compose ps` para ver se backend e dependencias estao no ar.
- Logs do backend: `docker-compose logs -f backend-api`.
- Variaveis essenciais: `DATABASE_URL`, `GENIACS_API_URL`, `OLT_MANAGER_URL`, `CREDENTIAL_ENCRYPTION_KEY`, `RABBITMQ_*`, `REDIS_PASSWORD`.

## Problemas comuns e solucoes

### 1) Erros 502/404 no gateway

Sinais comuns:
- Frontend recebe erro ao acessar `/api`.

Causa conhecida:
- `proxy_pass` do Nginx apontando para `backend` em vez de `backend-api`.

Acoes recomendadas:
- Validar `infrastructure/nginx/nginx.conf` e ajustar para `http://backend-api:8000/api/`.
- Em dev, lembrar que o frontend roda em porta diferente (ex: 3000).

### 2) Backend nao sobe por erro de criptografia

Sinais comuns:
- Log: `CREDENTIAL_ENCRYPTION_KEY nao definida no ambiente`.

Acoes recomendadas:
- Definir `CREDENTIAL_ENCRYPTION_KEY` no `.env`.
- Reiniciar o container do backend.

### 3) Erro ao chamar GenieACS ou OLT Manager

Sinais comuns:
- Logs com `Erro ao buscar dispositivos`, `Erro ao chamar OLT Manager`, `Erro HTTP`.

Acoes recomendadas:
- Validar `GENIACS_API_URL` e `OLT_MANAGER_URL`.
- Confirmar que os servicos estao na mesma rede do compose.
- Verificar logs do `genieacs` e `olt-manager-huawei`.

### 4) Timeouts em discovery ou setup de OLT

Sinais comuns:
- Operacoes de descoberta/configuracao falham por timeout.

Acoes recomendadas:
- Discovery usa timeout de 60s e setup 120s (configurado no codigo).
- Se a OLT for lenta, ajustar timeouts nos services correspondentes.

### 5) Erros de banco de dados

Sinais comuns:
- Erros de tabela inexistente ou falha de conexao.

Acoes recomendadas:
- Verificar `DATABASE_URL`.
- Garantir que o `db-app` esta no ar.
- Rodar migracoes do Alembic se necessario.

### 6) Filas/redis afetando tarefas

Sinais comuns:
- Tarefas assincronas penduradas ou sem retorno.

Acoes recomendadas:
- Verificar containers `rabbitmq` e `redis`.
- Conferir credenciais em `.env` e variaveis do compose.

## Comandos uteis

```bash
# Logs do backend
docker-compose logs -f backend-api

# Status dos containers
docker-compose ps

# Ver se a API esta respondendo (ajuste a porta se necessario)
curl http://localhost:8000/docs

# Logs de servicos integrados
docker-compose logs -f genieacs olt-manager-huawei rabbitmq redis db-app
```
