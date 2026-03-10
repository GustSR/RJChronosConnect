# RJChronosConnect — Diretrizes do Projeto

Sistema inteligente de gerenciamento de rede para ISPs. Unifica OLTs, CPEs (via TR-069/GenieACS) e analytics com IA.

---

## 1. Regras de Contribuição

### Idioma
Todas as interações, respostas, explicações e comentários em **Português (Brasil)**.

### Adesão ao Stack
Usar exclusivamente ferramentas, bibliotecas e versões já estabelecidas no projeto. Para adicionar nova dependência: informar necessidade, justificar e pedir autorização explícita.

### Qualidade de Código
- **SOLID**, **Clean Code**, **DRY**, **KISS**, **YAGNI**
- **Separation of Concerns** e **Law of Demeter**
- Alta coesão, baixo acoplamento
- Nomes significativos, código legível e direto

### Commits
Formato: `<type>(<scope>): <descrição>`
Tipos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`

---

## 2. Arquitetura

### Visão Geral
Monorepo com microserviços, orquestrados via Docker Compose. Comunicação interna via HTTP e RabbitMQ.

```
[Cliente] → [Nginx] → [Edge Gateway :8081]
                          ├── Frontend (React SPA)
                          ├── Backend API (FastAPI)
                          └── GenieACS UI
```

### Serviços

| Serviço | Stack | Porta | Função |
|---------|-------|-------|--------|
| **edge** | Bun + Elysia 1.3.3 + Better Auth 1.3.4 | 8081 | API Gateway, autenticação, proxy |
| **frontend** | React 18.3.1 + Vite 7.1.3 + MUI 5.1.0 | 8088 (dev) | Interface web SPA |
| **backend-api** | FastAPI 0.104.1 + SQLAlchemy 2.0.23 | 8000/8090 | API core, lógica de negócio |
| **works** | Celery 5.3.6 + Pika 1.3.2 | — | Workers assíncronos |
| **olt-manager-huawei** | FastAPI + Netmiko + pysnmp | 8001 | Gerenciamento OLTs Huawei via SSH/SNMP |
| **olt-manager-fiberhome** | FastAPI + Netmiko | — | Gerenciamento OLTs FiberHome (inativo) |
| **genieacs** | Node.js (v1.2.13) | 3000/7557 | TR-069 ACS para CPEs |
| **log-consumer-postgresql** | aio-pika + SQLAlchemy | — | Logs críticos → PostgreSQL |
| **log-consumer-clickhouse** | aio-pika + clickhouse-connect | — | Logs operacionais → ClickHouse |
| **log-monitor** | FastAPI + aio-pika | 8083/8100 | Monitoramento da pipeline de logs |

### Bancos de Dados

| Serviço | Tecnologia | Porta | Função |
|---------|-----------|-------|--------|
| **db-app** | PostgreSQL 15-alpine | 5432 | Banco principal (app) |
| **db-acs** | MongoDB 8.0 | 27017 | GenieACS |
| **redis** | Redis alpine | 6379 | Cache, sessões, result backend Celery |
| **rabbitmq** | RabbitMQ 3.12-management | 5672/15672 | Message broker |
| **clickhouse** | ClickHouse 23.8-alpine | 8123/9000 | Logs operacionais e analytics |

---

## 3. Stack Tecnológico (versões exatas)

### Frontend (`services/frontend/`)
- React 18.3.1, TypeScript 4.1.2, Vite 7.1.3
- MUI 5.1.0, MUI Icons 5.1.0, MUI X-Data-Grid 8.11.2
- React Router 6.x, React Hook Form 7.62.0, Yup 0.32.11
- TanStack React Table 8.21.3, ApexCharts 4.0.0
- Axios 1.12.0, Better Auth 1.3.4 (cliente)
- Vitest 3.2.4, jsdom 26.1.0
- ESLint 9.34.0, Prettier 2.4.1
- Arquitetura: Feature-Sliced Design (FSD) — 40% implementado

### Edge (`services/edge/`)
- Bun (runtime), Elysia 1.3.3
- Better Auth 1.3.4, @elysiajs/static 1.0.0, @elysiajs/swagger 1.3.0
- PostgreSQL driver (pg 8.12.0)

### Backend API (`services/backend-api/`)
- FastAPI 0.104.1, Uvicorn 0.24.0, Pydantic 2.5.0
- SQLAlchemy 2.0.23 (async), Alembic 1.12.1, asyncpg 0.29.0, psycopg2-binary 2.9.9
- Celery 5.3.4, pika 1.3.2, aio-pika 9.3.1, Redis 5.0.1
- python-jose 3.3.0 (JWT), passlib[bcrypt] 1.7.4
- httpx 0.25.2, cryptography 41.0.7
- structlog 23.2.0, prometheus-client 0.19.0
- pandas 2.1.3, numpy 1.25.2, scikit-learn 1.3.2

### Works (`services/works/`)
- Celery 5.3.6, Pika 1.3.2, Redis 5.0.1
- Pydantic 2.5.2, HTTPX 0.25.2

### OLT Manager Huawei (`services/olts-managers/olt-manager-huawei/`)
- FastAPI, Uvicorn, Netmiko (SSH/Telnet), pysnmp (SNMP)
- Pika, Pydantic, PyYAML, openpyxl

---

## 4. Estrutura do Backend API

```
services/backend-api/app/
├── api/                    # Rotas HTTP (FastAPI routers)
│   ├── auth.py             # POST /api/auth/token, GET /api/auth/me
│   ├── subscribers.py      # CRUD /api/subscribers/
│   ├── devices.py          # CRUD /api/devices/
│   ├── provisioning.py     # /api/provisioning/
│   ├── tasks.py            # /api/tasks/
│   ├── monitoring.py       # /api/monitoring/
│   ├── wifi.py             # /api/wifi/
│   ├── internal_olts.py    # OLTs internas
│   └── olt_management/     # Sub-routers OLT
│       ├── base.py         # CRUD OLTs
│       ├── discovery.py    # Descoberta
│       ├── live.py         # Métricas em tempo real
│       ├── setup.py        # Setup/configuração
│       ├── logs.py         # Logs de setup
│       └── stats.py        # Estatísticas
├── models/                 # SQLAlchemy ORM (13 models)
│   ├── user.py, subscriber.py, device.py
│   ├── olt.py, olt_port.py, olt_setup_log.py
│   ├── task.py, task_status.py, task_type.py
│   ├── activity_log.py, log_level.py, device_status.py
│   └── log_compliance_rule.py
├── schemas/                # Pydantic (validação I/O)
├── crud/                   # Operações de banco (OLT, Device, Subscriber, User)
├── services/               # Lógica de negócio
│   ├── genieacs_client.py  # Cliente GenieACS (HTTP)
│   ├── olt_manager_client.py
│   ├── olt_discovery_service.py
│   ├── olt_setup_service.py
│   └── rabbitmq_publisher.py
├── core/                   # Config, security, crypto, logging, celery_client
├── database/               # Engine, session, seed_data
└── tasks/                  # Celery tasks (migrando para works)
```

### Models SQLAlchemy Existentes
- **User** — email único, senha hash, admin flag
- **Subscriber** — CPF/CNPJ único, dados de contato
- **Device** — serial único, MAC, genieacs_id, ont_id, FK subscriber/olt_port/status
- **Olt** — IP único, vendor/model, credenciais criptografadas (hybrid_property), VLANs
- **OltPort** — slot/port_number, FK olt
- **OltSetupLog** — logs de configuração com duration
- **Task** — JSONB para params/result, FK user/device/type/status
- **ActivityLog** — trace_id, compliance LGPD, service_name
- **Lookups** — DeviceStatus, TaskStatus, TaskType, LogLevel, LogComplianceRule

### 8 Migrations Alembic (sequenciais)
1. Schema inicial v2 (todas as tabelas base)
2. Campos de descoberta/configuração OLT
3. Sistema de logging avançado + compliance LGPD
4. Criptografia de credenciais OLT
5. Protocolo de acesso (ssh/telnet)
6. Campo ont_id em devices
7. Campos VLAN em OLT
8. Flag create_mgmt_service_port

---

## 5. Autenticação

### Arquitetura
- **Fonte de verdade:** Better Auth 1.3.4 no Edge Gateway
- **Sessões:** PostgreSQL (tabela `session` do Better Auth)
- **Fluxo:** Edge valida sessão → injeta `X-User-Id`/`X-User-Email` → Backend lê headers
- **Proteção:** Middleware global no Backend, todas as rotas protegidas por padrão
- **Auto-provision:** Backend cria user local automaticamente no primeiro request

### Tabelas de usuário
- `user` (Better Auth, Edge) — auth, sessões, email/password
- `users` (Backend) — dados de negócio, FKs, campo `external_id` linkando ao Better Auth

### Rotas públicas (whitelist)
- `/docs`, `/openapi.json`, `/redoc` — documentação
- `/health` — healthcheck
- `/` — root

---

## 6. Estado do Projeto (atualizado 09/03/2026)

**Progresso geral auditado: ~35%** (Cronograma formal: 33/162 tarefas = 20%)

### Por Camada

| Camada | % | Métricas Concretas | O que falta |
|--------|---|-------------------|-------------|
| OLT Manager Huawei | 95% | 58 endpoints, 13K LOC, SSH+SNMP completo | Testes, retry avançado |
| Frontend (UI/UX) | 85% | 18 páginas, 269 arquivos TS/TSX, 10 features | Zero testes, FSD 40%, 139 refs mock data, componentes >400 linhas |
| OLT Manager FiberHome | 80% | 15 endpoints, 2.2K LOC | Menos maduro que Huawei |
| Edge Gateway | 85% | ~700 LOC, Better Auth 1.3.4, proxy com auth headers | Testes E2E do Edge |
| Workers/Celery | 70% | 8 tasks Celery, handlers RabbitMQ, 2 services | Error handling, retry logic, monitoramento |
| Infraestrutura | 60% | 12 containers Docker, Nginx enterprise, 6 CI/CD workflows | TLS 1.3, HSTS, dashboards Grafana |
| Logging/Monitoramento | 40% | PostgreSQL + ClickHouse consumers, Prometheus integrado | Dashboards, alertas, métricas customizadas |
| Dados (Schema) | 40% | 13 models, 8 migrations, 33 CRUD functions | TimescaleDB, séries temporais |
| Segurança | 30% | CORS, JWT, bcrypt, headers Nginx, criptografia OLT | CSRF, TLS 1.3, HSTS, 2FA, API key rotation |
| Backend API | 25% | 42 endpoints em 10 routers, ~6.5K LOC | ~10% testes, tasks incompleto, mock data em monitoring |
| Testes | 8% | 6 arquivos, 76 testes, ~800 LOC (backend apenas) | 0% frontend, 0% workers, 0% OLT managers, 0% edge |
| IA/ML | 0% | Libs instaladas (numpy, pandas, scikit-learn) | Zero modelos implementados |

### Endpoints Backend: Real vs Mock

| Endpoint | Status |
|----------|--------|
| `/api/auth/*` | ✅ Real (JWT + bcrypt) |
| `/api/subscribers/*` | ✅ Real (CRUD DB) |
| `/api/devices/onus` | ✅ Real (DB) |
| `/api/devices/cpes` | ✅ Real (GenieACS NBI) |
| `/api/provisioning/*` | ✅ Real (Celery async) |
| `/api/wifi/*` | ✅ Real (GenieACS config) |
| `/api/olt-management/*` | ✅ Real (Huawei manager) |
| `/api/monitoring/alerts` | ✅ Real (GenieACS faults) |
| `/api/monitoring/dashboard` | 🟡 Híbrido (GenieACS + fallback) |
| `/api/tasks/*` | 🟡 Parcial (schema existe, lógica incompleta) |

### Problemas Críticos (por prioridade)

1. ~~**P1 — Auth desincronizada:**~~ **RESOLVIDO** — Edge injeta headers, Backend valida via middleware global
2. **P1 — Testes:** 8% cobertura global, impossível validar refactorings com segurança
3. **P2 — TLS 1.3 + HSTS:** Produção em HTTP é inaceitável, config Nginx comentada
4. **P3 — FSD Frontend:** Componentes gigantes (>400 LOC), 139 refs a mock/fakeData
5. **P4 — IA/ML:** Libs instaladas sem ROI, zero modelos
6. **P5 — Séries temporais:** ClickHouse rodando mas subutilizado, sem TimescaleDB

---

## 7. Infraestrutura

### Docker Compose
- `docker-compose.yml` — Base (todos os serviços core)
- `docker-compose.dev.yml` — Dev override (frontend, works, olt-managers, volumes)
- `docker-compose.prod.yml` — Prod override (restart:always, healthchecks, concorrência)

### Rede
- `rjchronos-net` (bridge) — comunicação entre serviços
- `onu_management_net` (macvlan) — dual-homed GenieACS (dev)

### CI/CD
- GitHub Actions: `.github/workflows/ci.yml`
- Jobs: build + verificação Docker Compose (dev e prod)
- Gemini workflows para code review e triage automáticos

---

## 8. Documentação de Referência

| Documento | Caminho | Conteúdo |
|-----------|---------|----------|
| Cronograma | `docs/Cronograma_Dalfrede.md` | Roadmap 162 tarefas, checklist por sprint |
| Arquitetura | `docs/Arquitetura_Dalfrede.md` | Especificação técnica completa |
| Frontend Refactor | `docs/FRONTEND_REFACTOR_PLAN.md` | Plano FSD, componentes a refatorar |
| API Endpoints | `docs/API_ENDPOINTS_BACKEND.md` | Endpoints documentados |
| Logging | `docs/LOGGING_SYSTEM.md` | Sistema de logging centralizado |
| Provisioning | `docs/PROVISIONING_GUIDE.md` | Guia de provisionamento ONU |
| Dev Setup | `DEVELOPMENT.md` | Setup do ambiente de desenvolvimento |
