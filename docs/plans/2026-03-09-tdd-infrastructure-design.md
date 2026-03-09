# Design: Infraestrutura TDD + Integração Backend

**Data:** 09/03/2026
**Branch:** feature/frontend-refactor
**Status:** Aprovado

---

## Contexto

O backend possui 13 models SQLAlchemy, 8 migrations Alembic e CRUDs funcionais, mas 0% de cobertura de testes. Vários endpoints ainda retornam fake data em vez de consultar o banco real. A estratégia é usar TDD (RED→GREEN→REFACTOR) para integrar endpoints com o banco real, garantindo que nada quebre no processo.

## Decisoes

| Decisao | Escolha | Justificativa |
|---------|---------|---------------|
| Banco de teste | PostgreSQL fixo (docker-compose.dev.yml, porta 5433) | Sem overhead de testcontainers, 100% compativel com producao |
| Escopo de models | Incremental por uso (OLT → Subscriber → Device) | YAGNI — testar o que sera integrado imediatamente |
| Fixtures | pytest fixtures com seed data | Simples, reutiliza seed_data.py existente |
| Abordagem TDD | Testar conforme integra (RED→GREEN nos endpoints) | Valor imediato — cada teste valida a substituicao de mock por real |

## Infraestrutura

### Novo servico: db-test

```yaml
# docker-compose.dev.yml
db-test:
  image: postgres:15-alpine
  ports:
    - "5433:5432"
  environment:
    POSTGRES_DB: rjchronos_test
    POSTGRES_USER: rjchronos
    POSTGRES_PASSWORD: rjchronos_test
  networks:
    - rjchronos-net
```

### Novas dependencias

```
# services/backend-api/requirements.txt (adicionar)
pytest==7.4.3
pytest-asyncio==0.23.2
```

httpx 0.25.2 ja existe no projeto.

### Estrutura de testes

```
services/backend-api/
├── pytest.ini              # Configuracao pytest
└── tests/
    ├── conftest.py         # Engine, session, fixtures, TestClient
    ├── test_olt_endpoints.py
    ├── test_subscriber_endpoints.py
    └── test_device_endpoints.py
```

### conftest.py

Responsabilidades:
1. Criar async engine apontando para db-test (porta 5433)
2. Rodar migrations Alembic antes da sessao de testes
3. Fixture `db_session` — sessao com rollback apos cada teste
4. Fixture `client` — TestClient FastAPI com override de dependencias (get_db)
5. Fixtures de seed: `sample_olt`, `sample_subscriber`, `sample_device`

## Ciclos TDD

### Ciclo 1: OLTs (primeiro)

| Teste (RED) | Endpoint | Integracao (GREEN) |
|-------------|----------|--------------------|
| test_create_olt | POST /api/olt-management/base | CRUD real → banco |
| test_list_olts | GET /api/olt-management/base | Query real → banco |
| test_get_olt_by_id | GET /api/olt-management/base/{id} | Query por ID |
| test_update_olt | PUT /api/olt-management/base/{id} | Update real |
| test_delete_olt | DELETE /api/olt-management/base/{id} | Soft/hard delete |
| test_olt_credentials_encrypted | — | Validar criptografia |

### Ciclo 2: Subscribers

| Teste (RED) | Endpoint | Integracao (GREEN) |
|-------------|----------|--------------------|
| test_create_subscriber | POST /api/subscribers/ | CRUD real |
| test_list_subscribers | GET /api/subscribers/ | Query com paginacao |
| test_search_subscribers | GET /api/subscribers/?search=... | Busca ilike |
| test_update_subscriber | PUT /api/subscribers/{id} | Update real |
| test_delete_subscriber | DELETE /api/subscribers/{id} | Delete real |

### Ciclo 3: Devices

| Teste (RED) | Endpoint | Integracao (GREEN) |
|-------------|----------|--------------------|
| test_create_device | POST /api/devices/ | CRUD real |
| test_list_devices | GET /api/devices/ | Query real |
| test_get_device_by_serial | GET /api/devices/serial/{serial} | Busca por serial |
| test_update_device | PUT /api/devices/{id} | Update real |
| test_device_relationships | — | FK subscriber + olt_port |
