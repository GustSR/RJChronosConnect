# Stack atual (Bun + Elysia + Better Auth)

## Visao geral
- **Orquestracao**: Docker Compose (base + override de dev).
- **EntryPoint**: servico **Edge** (Bun + Elysia) e o **endpoint publico**; em producao serve o build do frontend e faz proxy das rotas `/api` para o backend.
- **Backend de dominio**: **FastAPI** (`services/backend-api`) e interno (exposto via Edge).
- **Frontend**: **React + Vite** (`services/frontend`). Em dev roda no servidor Vite (porta 3000); em prod o build e servido pelo Edge.
- **ACS / TR-069**: **GenieACS** (`services/genieacs`) + **MongoDB** (`db-acs`). Em dev ha containers auxiliares (`genieacs-sim`, `genieacs-mcp`).
- **OLT Managers**: microservicos Huawei/Fiberhome (`services/olts-managers/*`).
- **Worker**: `services/works` para tarefas assincronas.
- **Logging**: RabbitMQ + ClickHouse + consumers + log-monitor.

## Dados, cache e filas
- **PostgreSQL**: `db-app` (dados do app e logs criticos).
- **MongoDB**: `db-acs` (dados do GenieACS).
- **Redis**: cache e resultados de tarefas.
- **RabbitMQ**: mensageria e logging.

## Fluxo (alto nivel)
Browser
  -> Edge (Bun + Elysia)
       -> Backend FastAPI
       -> GenieACS
       -> Redis / RabbitMQ / Postgres / ClickHouse
       -> OLT Managers (Huawei/Fiberhome)

## Observacoes de portas (dev)
- Edge: 8081
- Frontend: 3000
- Backend: 8000
- OLT managers: 8001/8002
- Log monitor: 8083/8100
- RabbitMQ: 5672/15672
- ClickHouse: 8123/9000
- MongoDB (ACS): 27017
