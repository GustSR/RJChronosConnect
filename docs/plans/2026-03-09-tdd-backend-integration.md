# TDD Backend Integration — Plano de Implementacao

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Configurar infraestrutura de testes com TDD e integrar endpoints de OLT com banco de dados real, substituindo fake data.

**Architecture:** PostgreSQL de teste dedicado (porta 5433), pytest com fixtures de seed data, ciclo RED-GREEN-REFACTOR nos endpoints de OLT. O backend usa SQLAlchemy sincrono com psycopg2, FastAPI TestClient sincrono.

**Tech Stack:** pytest 7.4.3, pytest-asyncio 0.23.2, httpx 0.25.2 (ja instalado), PostgreSQL 15, SQLAlchemy 2.0.23, FastAPI 0.104.1

---

## Task 1: Adicionar container PostgreSQL de teste

**Files:**
- Modify: `docker-compose.dev.yml`

**Step 1: Adicionar servico db-test no docker-compose.dev.yml**

Adicionar ANTES do bloco `volumes:` no final do arquivo:

```yaml
    db-test:
        container_name: rjchronos_db_test
        image: postgres:15-alpine
        environment:
            - POSTGRES_USER=rjchronos
            - POSTGRES_PASSWORD=rjchronos_test
            - POSTGRES_DB=rjchronos_test
        ports:
            - "5433:5432"
        networks:
            - rjchronos-net
        healthcheck:
            test: ["CMD-SHELL", "pg_isready -U rjchronos -d rjchronos_test"]
            interval: 5s
            timeout: 5s
            retries: 5
```

**Step 2: Subir o container e verificar**

Run: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up db-test -d`
Expected: Container rodando, porta 5433 acessivel

**Step 3: Verificar conexao**

Run: `PGPASSWORD=rjchronos_test psql -h localhost -p 5433 -U rjchronos -d rjchronos_test -c "SELECT 1;"`
Expected: Retorna `1`

**Step 4: Commit**

```bash
git add docker-compose.dev.yml
git commit -m "chore(tests): adiciona container PostgreSQL de teste no docker-compose.dev"
```

---

## Task 2: Adicionar dependencias de teste

**Files:**
- Modify: `services/backend-api/requirements.txt`

**Step 1: Adicionar pytest e pytest-asyncio ao requirements.txt**

Adicionar ao final do arquivo:

```
# Testing
pytest==7.4.3
pytest-asyncio==0.23.2
```

**Step 2: Criar pytest.ini**

Criar arquivo `services/backend-api/pytest.ini`:

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short
```

**Step 3: Verificar que as dependencias instalam**

Run: `cd services/backend-api && pip install pytest==7.4.3 pytest-asyncio==0.23.2`
Expected: Instalacao sem erros

**Step 4: Commit**

```bash
git add services/backend-api/requirements.txt services/backend-api/pytest.ini
git commit -m "chore(tests): adiciona pytest e pytest-asyncio como dependencias de teste"
```

---

## Task 3: Criar conftest.py com engine de teste e fixtures base

**Files:**
- Create: `services/backend-api/tests/conftest.py`

**Step 1: Escrever conftest.py**

```python
import os
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Configura URL do banco de teste ANTES de importar a app
os.environ.setdefault("DATABASE_URL", "postgresql://rjchronos:rjchronos_test@localhost:5433/rjchronos_test")
os.environ.setdefault("CREDENTIAL_ENCRYPTION_KEY", "test-encryption-key-for-testing-only")

from app.database.base import Base
from app.database.database import get_db
from app.main import app


# Engine e Session para o banco de teste
TEST_DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Cria todas as tabelas no banco de teste antes da sessao de testes."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    """Fornece uma sessao de banco com rollback apos cada teste."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """TestClient do FastAPI com override da dependencia get_db."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

**Step 2: Verificar que o conftest carrega sem erro**

Run: `cd services/backend-api && python -m pytest tests/ --collect-only`
Expected: `no tests ran` (sem erros de import)

**Step 3: Commit**

```bash
git add services/backend-api/tests/conftest.py
git commit -m "feat(tests): cria conftest.py com engine de teste, session e TestClient"
```

---

## Task 4: Escrever teste RED — criar OLT

**Files:**
- Create: `services/backend-api/tests/test_olt_endpoints.py`

**Step 1: Escrever o teste que deve passar (endpoint ja existe e usa banco real)**

```python
import pytest


class TestCreateOLT:
    """Testes para POST /api/olt-management/base/"""

    def test_create_olt_returns_201(self, client):
        """Cria uma OLT e verifica que retorna 201 com dados corretos."""
        payload = {
            "name": "OLT-TESTE-01",
            "ip_address": "10.0.0.1",
            "vendor": "Huawei",
            "model": "MA5800-X7",
        }

        response = client.post("/api/olt-management/base/", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "OLT-TESTE-01"
        assert data["ip_address"] == "10.0.0.1"
        assert data["vendor"] == "Huawei"
        assert data["model"] == "MA5800-X7"
        assert data["setup_status"] == "pending"
        assert data["is_configured"] is False
        assert "id" in data
        assert "created_at" in data

    def test_create_olt_duplicate_name_returns_400(self, client):
        """Rejeita OLT com nome duplicado."""
        payload = {
            "name": "OLT-DUPLICADA",
            "ip_address": "10.0.0.2",
        }
        client.post("/api/olt-management/base/", json=payload)

        payload["ip_address"] = "10.0.0.3"
        response = client.post("/api/olt-management/base/", json=payload)

        assert response.status_code == 400
        assert "nome" in response.json()["detail"].lower() or "name" in response.json()["detail"].lower()

    def test_create_olt_duplicate_ip_returns_400(self, client):
        """Rejeita OLT com IP duplicado."""
        payload = {
            "name": "OLT-IP-01",
            "ip_address": "10.0.0.4",
        }
        client.post("/api/olt-management/base/", json=payload)

        payload["name"] = "OLT-IP-02"
        response = client.post("/api/olt-management/base/", json=payload)

        assert response.status_code == 400
        assert "ip" in response.json()["detail"].lower()

    def test_create_olt_with_credentials(self, client):
        """Cria OLT com credenciais SSH e verifica que sao aceitas."""
        payload = {
            "name": "OLT-COM-CRED",
            "ip_address": "10.0.0.5",
            "vendor": "Huawei",
            "ssh_username": "admin",
            "ssh_password": "secret123",
            "ssh_port": 22,
            "access_protocol": "ssh",
        }

        response = client.post("/api/olt-management/base/", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["ssh_username"] == "admin"
        assert data["access_protocol"] == "ssh"

    def test_create_olt_with_vlan_config(self, client):
        """Cria OLT com configuracao de VLAN."""
        payload = {
            "name": "OLT-VLAN",
            "ip_address": "10.0.0.6",
            "mgmt_vlan": 100,
            "service_vlan": 200,
            "create_mgmt_service_port": True,
        }

        response = client.post("/api/olt-management/base/", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["mgmt_vlan"] == 100
        assert data["service_vlan"] == 200
        assert data["create_mgmt_service_port"] is True
```

**Step 2: Rodar teste para verificar resultado**

Run: `cd services/backend-api && python -m pytest tests/test_olt_endpoints.py::TestCreateOLT -v`
Expected: Testes passam (endpoints ja usam CRUD real com banco)

Nota: Se algum teste FALHAR, isso indica que o endpoint tem problema — corrija na Task seguinte.

**Step 3: Commit**

```bash
git add services/backend-api/tests/test_olt_endpoints.py
git commit -m "test(olt): adiciona testes de criacao de OLT via endpoint"
```

---

## Task 5: Escrever testes — listar e buscar OLTs

**Files:**
- Modify: `services/backend-api/tests/test_olt_endpoints.py`

**Step 1: Adicionar fixture de OLT e testes de listagem**

Adicionar ao arquivo, apos TestCreateOLT:

```python
@pytest.fixture()
def sample_olt(client):
    """Cria uma OLT de exemplo para testes que precisam de dado existente."""
    payload = {
        "name": "OLT-FIXTURE",
        "ip_address": "192.168.1.1",
        "vendor": "Huawei",
        "model": "MA5600T",
        "mgmt_vlan": 200,
    }
    response = client.post("/api/olt-management/base/", json=payload)
    return response.json()


class TestListOLTs:
    """Testes para GET /api/olt-management/base/"""

    def test_list_olts_empty(self, client):
        """Lista OLTs quando nao ha nenhuma cadastrada."""
        response = client.get("/api/olt-management/base/")

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_list_olts_returns_created(self, client, sample_olt):
        """Lista OLTs e verifica que a OLT criada esta presente."""
        response = client.get("/api/olt-management/base/")

        assert response.status_code == 200
        olts = response.json()
        assert len(olts) >= 1
        names = [o["name"] for o in olts]
        assert "OLT-FIXTURE" in names

    def test_list_olts_with_pagination(self, client, sample_olt):
        """Testa paginacao com skip e limit."""
        response = client.get("/api/olt-management/base/?skip=0&limit=1")

        assert response.status_code == 200
        olts = response.json()
        assert len(olts) <= 1


class TestGetOLT:
    """Testes para GET /api/olt-management/base/{olt_id}"""

    def test_get_olt_by_id(self, client, sample_olt):
        """Busca OLT por ID e verifica dados."""
        olt_id = sample_olt["id"]

        response = client.get(f"/api/olt-management/base/{olt_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == olt_id
        assert data["name"] == "OLT-FIXTURE"
        assert data["vendor"] == "Huawei"

    def test_get_olt_not_found(self, client):
        """Retorna 404 para OLT inexistente."""
        response = client.get("/api/olt-management/base/99999")

        assert response.status_code == 404
```

**Step 2: Rodar testes**

Run: `cd services/backend-api && python -m pytest tests/test_olt_endpoints.py -v`
Expected: Todos passam

**Step 3: Commit**

```bash
git add services/backend-api/tests/test_olt_endpoints.py
git commit -m "test(olt): adiciona testes de listagem e busca de OLT por ID"
```

---

## Task 6: Escrever testes — atualizar e deletar OLTs

**Files:**
- Modify: `services/backend-api/tests/test_olt_endpoints.py`

**Step 1: Adicionar testes de update e delete**

Adicionar ao final do arquivo:

```python
class TestUpdateOLT:
    """Testes para PUT /api/olt-management/base/{olt_id}"""

    def test_update_olt_name(self, client, sample_olt):
        """Atualiza o nome de uma OLT."""
        olt_id = sample_olt["id"]
        payload = {"name": "OLT-ATUALIZADA"}

        response = client.put(f"/api/olt-management/base/{olt_id}", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "OLT-ATUALIZADA"
        assert data["vendor"] == "Huawei"  # Nao mudou

    def test_update_olt_vlan(self, client, sample_olt):
        """Atualiza configuracao de VLAN."""
        olt_id = sample_olt["id"]
        payload = {"mgmt_vlan": 300, "service_vlan": 400}

        response = client.put(f"/api/olt-management/base/{olt_id}", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["mgmt_vlan"] == 300
        assert data["service_vlan"] == 400

    def test_update_olt_not_found(self, client):
        """Retorna 404 ao atualizar OLT inexistente."""
        payload = {"name": "FANTASMA"}

        response = client.put("/api/olt-management/base/99999", json=payload)

        assert response.status_code == 404


class TestDeleteOLT:
    """Testes para DELETE /api/olt-management/base/{olt_id}"""

    def test_delete_olt(self, client, sample_olt):
        """Deleta uma OLT e verifica que nao existe mais."""
        olt_id = sample_olt["id"]

        response = client.delete(f"/api/olt-management/base/{olt_id}")
        assert response.status_code == 200

        # Verifica que foi removida
        get_response = client.get(f"/api/olt-management/base/{olt_id}")
        assert get_response.status_code == 404

    def test_delete_olt_not_found(self, client):
        """Retorna 404 ao deletar OLT inexistente."""
        response = client.delete("/api/olt-management/base/99999")

        assert response.status_code == 404
```

**Step 2: Rodar todos os testes**

Run: `cd services/backend-api && python -m pytest tests/test_olt_endpoints.py -v`
Expected: Todos passam

**Step 3: Commit**

```bash
git add services/backend-api/tests/test_olt_endpoints.py
git commit -m "test(olt): adiciona testes de update e delete de OLT"
```

---

## Task 7: Escrever testes — filtros de OLT (setup_status, unconfigured)

**Files:**
- Modify: `services/backend-api/tests/test_olt_endpoints.py`

**Step 1: Adicionar testes de filtros**

Adicionar ao final do arquivo:

```python
class TestOLTFilters:
    """Testes para filtros nos endpoints de OLT."""

    def test_filter_by_setup_status(self, client):
        """Filtra OLTs por setup_status."""
        # Cria OLT com status pending (padrao)
        client.post("/api/olt-management/base/", json={
            "name": "OLT-PENDING",
            "ip_address": "10.1.0.1",
        })

        response = client.get("/api/olt-management/base/?setup_status=pending")

        assert response.status_code == 200
        olts = response.json()
        assert all(o["setup_status"] == "pending" for o in olts)

    def test_filter_unconfigured(self, client):
        """Filtra OLTs nao configuradas."""
        client.post("/api/olt-management/base/", json={
            "name": "OLT-UNCONF",
            "ip_address": "10.1.0.2",
        })

        response = client.get("/api/olt-management/base/?configured_only=false")

        assert response.status_code == 200
        olts = response.json()
        assert all(o["is_configured"] is False for o in olts)
```

**Step 2: Rodar todos os testes**

Run: `cd services/backend-api && python -m pytest tests/test_olt_endpoints.py -v`
Expected: Todos passam

**Step 3: Commit**

```bash
git add services/backend-api/tests/test_olt_endpoints.py
git commit -m "test(olt): adiciona testes de filtros por setup_status e configured_only"
```

---

## Task 8: Verificar cobertura e rodar suite completa

**Step 1: Rodar todos os testes com output detalhado**

Run: `cd services/backend-api && python -m pytest tests/ -v --tb=long`
Expected: Todos os testes passam, zero falhas

**Step 2: Contar testes**

Expected: ~15 testes cobrindo CRUD completo de OLT + filtros + edge cases

**Step 3: Commit final e tag**

```bash
git add -A
git commit -m "feat(tests): completa infraestrutura TDD e testes de endpoints OLT

- Adiciona container PostgreSQL de teste (porta 5433)
- Configura pytest com conftest.py, fixtures e TestClient
- Testes CRUD completos: create, list, get, update, delete
- Testes de filtros: setup_status, configured_only
- Testes de edge cases: duplicatas, not found, credenciais"
```

---

## Resumo das Tasks

| Task | Descricao | Arquivos |
|------|-----------|----------|
| 1 | Container PostgreSQL de teste | `docker-compose.dev.yml` |
| 2 | Dependencias pytest | `requirements.txt`, `pytest.ini` |
| 3 | conftest.py (engine, session, client) | `tests/conftest.py` |
| 4 | Testes RED — criar OLT | `tests/test_olt_endpoints.py` |
| 5 | Testes — listar e buscar OLT | `tests/test_olt_endpoints.py` |
| 6 | Testes — atualizar e deletar OLT | `tests/test_olt_endpoints.py` |
| 7 | Testes — filtros de OLT | `tests/test_olt_endpoints.py` |
| 8 | Verificacao final da suite | — |

## Proximo ciclo (apos completar)

Repetir o mesmo padrao para:
1. **Subscribers** — `tests/test_subscriber_endpoints.py`
2. **Devices** — `tests/test_device_endpoints.py`
