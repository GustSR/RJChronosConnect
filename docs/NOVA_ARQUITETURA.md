# Stack atual (com Bun + Elysia + Better Auth)

## Visão geral
- **Orquestração:** Docker + Docker Compose (dev/prod). :contentReference[oaicite:0]{index=0}
- **EntryPoint único (sem Nginx):** um serviço **Edge** rodando **Bun + Elysia** (é o **único** container com porta publicada). :contentReference[oaicite:1]{index=1}
- **Backend de domínio:** **FastAPI (Python)** como **core interno** (sem porta exposta publicamente). :contentReference[oaicite:2]{index=2}

## Serviços
### 1) Edge (API pública + Realtime + Auth)
- **Runtime:** Bun (toolkit/runtime JS/TS). :contentReference[oaicite:3]{index=3}
- **Servidor HTTP/WS:** Elysia
  - **WebSocket** para dashboards/realtime (`/ws/*`). :contentReference[oaicite:4]{index=4}
  - **Static files** para servir o build do React (`@elysiajs/static`). :contentReference[oaicite:5]{index=5}
- **Autenticação:** Better Auth integrado ao Elysia (handler montado no app). :contentReference[oaicite:6]{index=6}

### 2) Frontend
- **React + TypeScript + Vite** (em `services/frontend`).
- **Tooling:** Bun para instalar deps/rodar scripts/build/test do frontend. :contentReference[oaicite:7]{index=7}
- **Produção:** o `dist/` do Vite é servido pelo Edge via `@elysiajs/static`. :contentReference[oaicite:8]{index=8}

### 3) Core Backend
- **FastAPI (Python)** como API de domínio e integrações (OLTs/ONUs/CRM/provisionamento) + workers/IA. :contentReference[oaicite:9]{index=9}
- **Importante:** o Core é **interno** (o mundo externo fala só com o Edge).

### 4) ACS / TR-069
- **GenieACS (Node.js)** como ACS TR-069 (alta escala) + painel GenieACS-MCP.
- **Banco do GenieACS:** MongoDB. :contentReference[oaicite:10]{index=10}

## Dados, cache e filas
- **PostgreSQL:** dados do app + logs críticos + tabelas do Better Auth (recomendado separar por schema, ex.: `auth.*`). :contentReference[oaicite:11]{index=11}
- **MongoDB:** dados do GenieACS. :contentReference[oaicite:12]{index=12}
- **Redis:** cache/resultados e (opcional) backbone rápido para eventos de realtime. :contentReference[oaicite:13]{index=13}
- **RabbitMQ:** fila/mensageria para tarefas assíncronas e workers. :contentReference[oaicite:14]{index=14}

## Logging / Observabilidade
- **ClickHouse:** analytics/logs/telemetria (incluindo logs do Edge e do Core). :contentReference[oaicite:15]{index=15}
- **Consumers de log:** pipelines que gravam em PostgreSQL/ClickHouse (como vocês já têm).

## Fluxo (alto nível)
React (browser)
  -> Edge (Bun + Elysia + Better Auth)  [ÚNICO endpoint público]
       -> Core FastAPI (interno)
       -> Redis / RabbitMQ / Postgres / ClickHouse
       -> GenieACS (Node) <-> MongoDB
