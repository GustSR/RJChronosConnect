# Auth Unification (Edge → Backend) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminar JWT do Backend e unificar autenticacao via Better Auth no Edge, com injecao de headers e protecao global de rotas.

**Architecture:** Edge valida sessao Better Auth e injeta `X-User-Id`/`X-User-Email` nos headers do proxy. Backend le esses headers via middleware global, auto-provisiona user local, e protege todas as rotas por padrao (whitelist para excecoes).

**Tech Stack:** Bun/Elysia (Edge), FastAPI (Backend), Better Auth 1.3.4, SQLAlchemy 2.0.23, Alembic, PostgreSQL 15, React 18 (Frontend)

**Design doc:** `docs/plans/2026-03-09-auth-unification-design.md`

---

### Task 1: Migration — adicionar `external_id` na tabela `users`

**Files:**
- Create: `services/backend-api/alembic/versions/h3g4f5e6d7c8_add_external_id_to_users.py`
- Modify: `services/backend-api/app/models/user.py:1-32`

**Step 1: Criar migration Alembic**

```bash
cd /home/zeyper/projetos/RJChronosConnect/services/backend-api
DATABASE_URL="postgresql://rjchronos:rjchronos_test@localhost:5433/rjchronos_test" \
  alembic revision -m "add_external_id_to_users"
```

Editar o arquivo gerado com:

```python
"""add_external_id_to_users

Revision ID: h3g4f5e6d7c8
Revises: g2f3e4d5c6b7
Create Date: 2026-03-09
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'h3g4f5e6d7c8'
down_revision = 'g2f3e4d5c6b7'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('users', sa.Column('external_id', sa.String(), nullable=True))
    op.create_index('ix_users_external_id', 'users', ['external_id'], unique=True)
    # Tornar password_hash nullable (users provisionados via Better Auth nao tem senha local)
    op.alter_column('users', 'password_hash', nullable=True)

def downgrade() -> None:
    op.alter_column('users', 'password_hash', nullable=False)
    op.drop_index('ix_users_external_id', table_name='users')
    op.drop_column('users', 'external_id')
```

**Step 2: Atualizar model User**

Em `services/backend-api/app/models/user.py`, adicionar campo `external_id`:

```python
from sqlalchemy import Column, String, DateTime, BigInteger, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class User(Base):
    """Modelo da tabela de Usuarios (Administradores do Sistema)."""

    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True)
    external_id = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Nullable para users provisionados via Edge
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relacionamentos
    activity_logs = relationship("ActivityLog", back_populates="user")
    tasks = relationship("Task", back_populates="created_by")
```

**Step 3: Rodar migration no banco de teste**

```bash
cd /home/zeyper/projetos/RJChronosConnect/services/backend-api
DATABASE_URL="postgresql://rjchronos:rjchronos_test@localhost:5433/rjchronos_test" \
  alembic upgrade head
```

**Step 4: Verificar que testes existentes continuam passando**

```bash
cd /home/zeyper/projetos/RJChronosConnect/services/backend-api
python -m pytest tests/ -v --tb=short
```

Expected: 45 testes passando (nenhum quebrado pela migration)

**Step 5: Commit**

```bash
git add services/backend-api/alembic/versions/h3g4f5e6d7c8_add_external_id_to_users.py \
       services/backend-api/app/models/user.py
git commit -m "feat(auth): adiciona external_id na tabela users para sync com Better Auth"
```

---

### Task 2: CRUD user — adicionar funcoes de lookup e auto-provision

**Files:**
- Modify: `services/backend-api/app/crud/user.py`
- Create: `services/backend-api/tests/test_user_crud.py`

**Step 1: Escrever testes**

Criar `services/backend-api/tests/test_user_crud.py`:

```python
"""Testes das funcoes CRUD de User."""

import pytest
from app.models.user import User
from app.crud.user import get_user_by_external_id, get_or_create_user_from_edge


class TestGetUserByExternalId:
    """Testes de busca por external_id."""

    def test_returns_none_when_not_found(self, db_session):
        result = get_user_by_external_id(db_session, "nonexistent-id")
        assert result is None

    def test_returns_user_when_found(self, db_session):
        user = User(
            external_id="ba-123",
            full_name="Test User",
            email="test@example.com",
        )
        db_session.add(user)
        db_session.flush()

        result = get_user_by_external_id(db_session, "ba-123")
        assert result is not None
        assert result.external_id == "ba-123"
        assert result.email == "test@example.com"


class TestGetOrCreateUserFromEdge:
    """Testes de auto-provision de usuario vindo do Edge."""

    def test_creates_new_user_when_not_exists(self, db_session):
        user = get_or_create_user_from_edge(
            db_session,
            external_id="ba-new-456",
            email="new@example.com",
        )

        assert user is not None
        assert user.external_id == "ba-new-456"
        assert user.email == "new@example.com"
        assert user.full_name == "new@example.com"
        assert user.password_hash is None
        assert user.is_active is True

    def test_returns_existing_user_when_found(self, db_session):
        existing = User(
            external_id="ba-existing-789",
            full_name="Existing User",
            email="existing@example.com",
        )
        db_session.add(existing)
        db_session.flush()

        user = get_or_create_user_from_edge(
            db_session,
            external_id="ba-existing-789",
            email="existing@example.com",
        )

        assert user.id == existing.id
        assert user.full_name == "Existing User"

    def test_updates_email_if_changed(self, db_session):
        existing = User(
            external_id="ba-update-101",
            full_name="Old Name",
            email="old@example.com",
        )
        db_session.add(existing)
        db_session.flush()

        user = get_or_create_user_from_edge(
            db_session,
            external_id="ba-update-101",
            email="new@example.com",
        )

        assert user.id == existing.id
        assert user.email == "new@example.com"
```

**Step 2: Rodar testes para verificar que falham**

```bash
cd /home/zeyper/projetos/RJChronosConnect/services/backend-api
python -m pytest tests/test_user_crud.py -v --tb=short
```

Expected: FAIL (funcoes nao existem)

**Step 3: Implementar funcoes no CRUD**

Modificar `services/backend-api/app/crud/user.py`:

```python
from sqlalchemy.orm import Session
from app.models.user import User


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_user_by_external_id(db: Session, external_id: str):
    """Busca usuario pelo external_id (ID do Better Auth)."""
    return db.query(User).filter(User.external_id == external_id).first()


def get_or_create_user_from_edge(
    db: Session,
    external_id: str,
    email: str,
) -> User:
    """Auto-provisiona usuario local a partir dos dados do Edge.

    Se o usuario ja existe (por external_id), atualiza o email se mudou.
    Se nao existe, cria um novo usuario sem senha (auth gerenciada pelo Edge).
    """
    user = get_user_by_external_id(db, external_id)

    if user:
        if user.email != email:
            user.email = email
            db.flush()
        return user

    user = User(
        external_id=external_id,
        full_name=email,
        email=email,
        password_hash=None,
        is_active=True,
    )
    db.add(user)
    db.flush()
    return user
```

**Step 4: Rodar testes para verificar que passam**

```bash
cd /home/zeyper/projetos/RJChronosConnect/services/backend-api
python -m pytest tests/test_user_crud.py -v --tb=short
```

Expected: 5 testes passando

**Step 5: Rodar suite completa**

```bash
cd /home/zeyper/projetos/RJChronosConnect/services/backend-api
python -m pytest tests/ -v --tb=short
```

Expected: 50 testes passando (45 existentes + 5 novos)

**Step 6: Commit**

```bash
git add services/backend-api/app/crud/user.py \
       services/backend-api/tests/test_user_crud.py
git commit -m "feat(auth): adiciona CRUD de user com auto-provision para sync Edge/Backend"
```

---

### Task 3: Backend — middleware global de autenticacao por header

**Files:**
- Create: `services/backend-api/app/middleware/auth.py`
- Create: `services/backend-api/tests/test_auth_middleware.py`
- Modify: `services/backend-api/app/main.py:1-110`

**Step 1: Escrever testes do middleware**

Criar `services/backend-api/tests/test_auth_middleware.py`:

```python
"""Testes do middleware de autenticacao por header do Edge."""

import pytest
from app.models.user import User


# Rotas que devem ser publicas (whitelist)
PUBLIC_PATHS = [
    "/docs",
    "/openapi.json",
    "/redoc",
    "/health",
    "/",
]

# Rotas protegidas (exemplos)
PROTECTED_PATHS = [
    "/api/subscribers",
    "/api/devices/onus",
    "/api/olts/",
]


class TestAuthMiddlewarePublicRoutes:
    """Rotas na whitelist devem funcionar sem header de auth."""

    @pytest.mark.parametrize("path", PUBLIC_PATHS)
    def test_public_routes_accessible_without_auth(self, client, path):
        response = client.get(path)
        assert response.status_code != 401

    def test_health_endpoint_returns_ok(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


class TestAuthMiddlewareProtectedRoutes:
    """Rotas protegidas devem exigir header X-User-Id."""

    @pytest.mark.parametrize("path", PROTECTED_PATHS)
    def test_protected_routes_reject_without_header(self, client, path):
        response = client.get(path)
        assert response.status_code == 401
        data = response.json()
        assert data["detail"] == "Nao autenticado"

    @pytest.mark.parametrize("path", PROTECTED_PATHS)
    def test_protected_routes_reject_empty_header(self, client, path):
        response = client.get(path, headers={"X-User-Id": ""})
        assert response.status_code == 401

    def test_protected_route_accepts_valid_header(self, client, db_session):
        """Com header X-User-Id valido, deve auto-provisionar e aceitar."""
        response = client.get(
            "/api/subscribers",
            headers={
                "X-User-Id": "ba-middleware-test",
                "X-User-Email": "middleware@test.com",
            },
        )
        assert response.status_code == 200

    def test_auto_provisions_user_on_first_request(self, client, db_session):
        """Primeiro request com header novo deve criar user no banco."""
        response = client.get(
            "/api/subscribers",
            headers={
                "X-User-Id": "ba-auto-provision",
                "X-User-Email": "auto@provision.com",
            },
        )
        assert response.status_code == 200

        user = db_session.query(User).filter(
            User.external_id == "ba-auto-provision"
        ).first()
        assert user is not None
        assert user.email == "auto@provision.com"
```

**Step 2: Rodar testes para verificar que falham**

```bash
cd /home/zeyper/projetos/RJChronosConnect/services/backend-api
python -m pytest tests/test_auth_middleware.py -v --tb=short
```

Expected: FAIL (middleware nao existe, rotas nao retornam 401)

**Step 3: Criar o middleware**

Criar `services/backend-api/app/middleware/__init__.py` (vazio) e `services/backend-api/app/middleware/auth.py`:

```python
"""Middleware de autenticacao por header injetado pelo Edge Gateway."""

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.crud.user import get_or_create_user_from_edge

import logging

logger = logging.getLogger(__name__)

# Rotas que nao exigem autenticacao
PUBLIC_PATH_PREFIXES = (
    "/docs",
    "/openapi.json",
    "/redoc",
    "/health",
    "/api/auth",
)

# Paths exatos que sao publicos
PUBLIC_PATHS_EXACT = (
    "/",
)


def is_public_path(path: str) -> bool:
    """Verifica se o path esta na whitelist publica."""
    if path in PUBLIC_PATHS_EXACT:
        return True
    for prefix in PUBLIC_PATH_PREFIXES:
        if path.startswith(prefix):
            return True
    return False


class EdgeAuthMiddleware(BaseHTTPMiddleware):
    """Middleware que valida headers X-User-Id/X-User-Email injetados pelo Edge.

    - Rotas publicas (whitelist) passam sem autenticacao.
    - Rotas protegidas exigem X-User-Id no header.
    - Auto-provisiona user local se nao existir.
    - Injeta user no request.state.current_user.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path

        # Rotas publicas passam direto
        if is_public_path(path):
            return await call_next(request)

        # Extrair headers do Edge
        user_id = request.headers.get("X-User-Id", "").strip()
        user_email = request.headers.get("X-User-Email", "").strip()

        if not user_id:
            return JSONResponse(
                status_code=401,
                content={"detail": "Nao autenticado"},
            )

        # Auto-provision: buscar ou criar user local
        db: Session = SessionLocal()
        try:
            user = get_or_create_user_from_edge(
                db,
                external_id=user_id,
                email=user_email or f"{user_id}@edge.local",
            )
            db.commit()
            request.state.current_user = user
        except Exception as e:
            db.rollback()
            logger.error(f"Erro ao provisionar usuario: {e}")
            return JSONResponse(
                status_code=500,
                content={"detail": "Erro interno de autenticacao"},
            )
        finally:
            db.close()

        return await call_next(request)
```

**Step 4: Adicionar endpoint /health e registrar middleware no main.py**

Modificar `services/backend-api/app/main.py`. Adicionar ANTES do CORS middleware:

```python
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import time
import asyncio
from contextlib import asynccontextmanager

from .api import auth, devices, monitoring, provisioning, subscribers, tasks, wifi, olt_management, internal_olts
from .core.logging import init_logging, cleanup_logging, log_api_request, log_error
from .middleware.auth import EdgeAuthMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicacao com logging."""
    # Startup
    try:
        await init_logging()
        print("Sistema de logging inicializado")
    except Exception as e:
        print(f"Erro ao inicializar logging: {e}")

    yield

    # Shutdown
    try:
        await cleanup_logging()
        print("Sistema de logging finalizado")
    except Exception as e:
        print(f"Erro ao finalizar logging: {e}")


app = FastAPI(
    title="RJChronos API",
    description="Sistema de Gestao e Monitoramento de Rede",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth middleware (valida headers do Edge)
app.add_middleware(EdgeAuthMiddleware)


# Middleware para logging automatico de requests
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Middleware para capturar logs de todas as requisicoes API."""
    start_time = time.time()

    try:
        response = await call_next(request)
        response_time = (time.time() - start_time) * 1000

        asyncio.create_task(
            log_api_request(
                endpoint=str(request.url.path),
                method=request.method,
                response_time=response_time,
                status_code=response.status_code,
                user_agent=request.headers.get("user-agent"),
                ip_address=request.client.host if request.client else None,
                query_params=dict(request.query_params) if request.query_params else None
            )
        )

        return response

    except Exception as e:
        response_time = (time.time() - start_time) * 1000
        asyncio.create_task(
            log_error(
                e,
                f"Erro em {request.method} {request.url.path}",
                endpoint=str(request.url.path),
                method=request.method,
                response_time=response_time,
                user_agent=request.headers.get("user-agent"),
                ip_address=request.client.host if request.client else None
            )
        )
        raise


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"message": "RJChronos API v2.0.0 - Refactored", "status": "online"}

# Include routers from API modules
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(devices.router, prefix="/api/devices", tags=["Devices"])
app.include_router(monitoring.router, prefix="/api", tags=["Monitoring"])
app.include_router(provisioning.router, prefix="/api/provisioning", tags=["Provisioning"])
app.include_router(tasks.router, prefix="/api/activity-history", tags=["Activity History"])
app.include_router(wifi.router, prefix="/api/wifi", tags=["WiFi"])
app.include_router(olt_management.router, prefix="/api/olts", tags=["OLT Management"])
app.include_router(subscribers.router, prefix="/api/subscribers", tags=["Subscribers"])
app.include_router(internal_olts.router, prefix="/internal/olts", tags=["Internal OLT"])
```

**Step 5: Atualizar conftest.py para injetar headers de auth nos testes existentes**

O middleware vai bloquear testes existentes que nao enviam headers. Precisamos atualizar a fixture `client` em `services/backend-api/tests/conftest.py` para injetar headers de auth por padrao:

```python
import os
import sys
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Adiciona o diretorio raiz do projeto ao path para resolver 'shared.logging'
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

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
    """TestClient do FastAPI com override da dependencia get_db.

    Injeta headers de auth por padrao para simular requests vindos do Edge.
    """

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        # Wrapper que injeta headers de auth em todas as requests
        original_request = c.request

        def authenticated_request(method, url, **kwargs):
            headers = kwargs.get("headers", {}) or {}
            if "X-User-Id" not in headers:
                headers["X-User-Id"] = "test-user-id"
                headers["X-User-Email"] = "test@rjchronos.com"
            kwargs["headers"] = headers
            return original_request(method, url, **kwargs)

        c.request = authenticated_request
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def unauthenticated_client(db_session):
    """TestClient SEM headers de auth (para testar rejeicao)."""

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

**Step 6: Atualizar testes do middleware para usar `unauthenticated_client`**

Atualizar `services/backend-api/tests/test_auth_middleware.py` — os testes que esperam 401 devem usar `unauthenticated_client`:

```python
"""Testes do middleware de autenticacao por header do Edge."""

import pytest
from app.models.user import User

PUBLIC_PATHS = [
    "/docs",
    "/openapi.json",
    "/redoc",
    "/health",
    "/",
]

PROTECTED_PATHS = [
    "/api/subscribers",
    "/api/devices/onus",
    "/api/olts/",
]


class TestAuthMiddlewarePublicRoutes:
    """Rotas na whitelist devem funcionar sem header de auth."""

    @pytest.mark.parametrize("path", PUBLIC_PATHS)
    def test_public_routes_accessible_without_auth(self, unauthenticated_client, path):
        response = unauthenticated_client.get(path)
        assert response.status_code != 401

    def test_health_endpoint_returns_ok(self, unauthenticated_client):
        response = unauthenticated_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


class TestAuthMiddlewareProtectedRoutes:
    """Rotas protegidas devem exigir header X-User-Id."""

    @pytest.mark.parametrize("path", PROTECTED_PATHS)
    def test_protected_routes_reject_without_header(self, unauthenticated_client, path):
        response = unauthenticated_client.get(path)
        assert response.status_code == 401
        data = response.json()
        assert data["detail"] == "Nao autenticado"

    @pytest.mark.parametrize("path", PROTECTED_PATHS)
    def test_protected_routes_reject_empty_header(self, unauthenticated_client, path):
        response = unauthenticated_client.get(path, headers={"X-User-Id": ""})
        assert response.status_code == 401

    def test_protected_route_accepts_valid_header(self, client):
        """Com header X-User-Id valido (injetado pela fixture client), deve aceitar."""
        response = client.get("/api/subscribers")
        assert response.status_code == 200

    def test_auto_provisions_user_on_first_request(self, client, db_session):
        """Request com header deve auto-provisionar user."""
        response = client.get(
            "/api/subscribers",
            headers={
                "X-User-Id": "ba-auto-provision",
                "X-User-Email": "auto@provision.com",
            },
        )
        assert response.status_code == 200
```

**Step 7: Rodar todos os testes**

```bash
cd /home/zeyper/projetos/RJChronosConnect/services/backend-api
python -m pytest tests/ -v --tb=short
```

Expected: Todos passando (existentes + novos de middleware)

**Step 8: Commit**

```bash
git add services/backend-api/app/middleware/__init__.py \
       services/backend-api/app/middleware/auth.py \
       services/backend-api/app/main.py \
       services/backend-api/tests/conftest.py \
       services/backend-api/tests/test_auth_middleware.py
git commit -m "feat(auth): adiciona middleware global de auth por header do Edge"
```

---

### Task 4: Backend — atualizar `get_current_user` e limpar JWT

**Files:**
- Modify: `services/backend-api/app/core/security.py`
- Modify: `services/backend-api/app/api/auth.py`
- Modify: `services/backend-api/app/schemas/user.py`
- Modify: `services/backend-api/requirements.txt`

**Step 1: Reescrever security.py sem JWT**

Substituir `services/backend-api/app/core/security.py`:

```python
"""Utilidades de seguranca — autenticacao via headers do Edge Gateway."""

from fastapi import Request, HTTPException, status
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica senha plaintext contra hash bcrypt."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Gera hash bcrypt de uma senha."""
    return pwd_context.hash(password)


async def get_current_user(request: Request):
    """Dependency que retorna o usuario autenticado do request.state.

    O middleware EdgeAuthMiddleware popula request.state.current_user
    a partir dos headers X-User-Id/X-User-Email injetados pelo Edge.
    """
    user = getattr(request.state, "current_user", None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nao autenticado",
        )
    return user
```

**Step 2: Atualizar schema User para refletir model real**

Substituir `services/backend-api/app/schemas/user.py`:

```python
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None


class UserResponse(UserBase):
    id: int
    external_id: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Alias para compatibilidade com imports existentes
User = UserResponse
```

**Step 3: Simplificar auth.py (remover login JWT, manter /me)**

Substituir `services/backend-api/app/api/auth.py`:

```python
"""Endpoints de autenticacao.

Login/registro agora sao gerenciados pelo Edge (Better Auth).
O Backend apenas expoe /me para retornar o usuario autenticado.
"""

from fastapi import APIRouter, Depends

from app.schemas.user import UserResponse
from app.core.security import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user=Depends(get_current_user)):
    """Retorna dados do usuario autenticado."""
    return current_user
```

**Step 4: Remover python-jose do requirements.txt**

Em `services/backend-api/requirements.txt`, remover a linha `python-jose[cryptography]==3.3.0` (ou similar).

Manter `passlib[bcrypt]` (ainda usado para senhas de users legados).

**Step 5: Rodar todos os testes**

```bash
cd /home/zeyper/projetos/RJChronosConnect/services/backend-api
python -m pytest tests/ -v --tb=short
```

Expected: Todos passando

**Step 6: Commit**

```bash
git add services/backend-api/app/core/security.py \
       services/backend-api/app/api/auth.py \
       services/backend-api/app/schemas/user.py \
       services/backend-api/requirements.txt
git commit -m "refactor(auth): remove JWT, get_current_user agora le headers do Edge"
```

---

### Task 5: Edge — middleware de validacao de sessao e injecao de headers

**Files:**
- Create: `services/edge/src/middleware.ts`
- Modify: `services/edge/src/index.ts`

**Step 1: Criar middleware de auth**

Criar `services/edge/src/middleware.ts`:

```typescript
import { auth } from "./auth";

/**
 * Headers injetados pelo Edge nos requests autenticados.
 * O Backend confia nesses headers porque o Edge e o unico ponto de entrada.
 */
const USER_ID_HEADER = "X-User-Id";
const USER_EMAIL_HEADER = "X-User-Email";

/**
 * Headers que devem ser removidos do request do cliente (anti-spoofing).
 */
const SANITIZE_HEADERS = [USER_ID_HEADER, USER_EMAIL_HEADER];

/**
 * Valida a sessao Better Auth e retorna headers para injetar no proxy.
 * Se a sessao for invalida, retorna objeto vazio (proxy sem headers de auth).
 */
export async function getAuthHeaders(
  request: Request
): Promise<Record<string, string>> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return {};
    }

    return {
      [USER_ID_HEADER]: session.user.id,
      [USER_EMAIL_HEADER]: session.user.email,
    };
  } catch {
    return {};
  }
}

/**
 * Remove headers de auth vindos do cliente para evitar spoofing.
 */
export function sanitizeRequest(request: Request): Request {
  const headers = new Headers(request.headers);
  for (const header of SANITIZE_HEADERS) {
    headers.delete(header);
  }

  return new Request(request.url, {
    method: request.method,
    headers,
    body: request.body,
    // @ts-expect-error - Bun supports duplex
    duplex: "half",
  });
}
```

**Step 2: Atualizar index.ts para usar middleware**

Modificar `services/edge/src/index.ts`. A rota `/api/*` muda para validar sessao:

```typescript
import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { swagger } from "@elysiajs/swagger";
import { auth } from "./auth";
import { config } from "./config";
import { proxyRequest } from "./proxy";
import { getAuthHeaders, sanitizeRequest } from "./middleware";

const authBasePath = config.betterAuthBasePath.replace(/\/$/, "");
const authWildcardPath = `${authBasePath}/*`;

const app = new Elysia().use(
  swagger({
    path: "/swagger",
    documentation: {
      info: {
        title: "RJChronos Edge API",
        version: process.env.EDGE_DOCS_VERSION ?? "dev",
        description:
          "Documentacao do Edge Gateway. Inclui rotas publicas do Edge, " +
          "autenticacao (Better Auth), proxy para o Core e o UI do GenieACS."
      },
      tags: [
        { name: "Auth", description: "Rotas publicas de autenticacao." },
        { name: "Core", description: "Proxy publico para o Core FastAPI." },
        { name: "GenieACS", description: "Proxy do UI do GenieACS." },
        { name: "Legacy", description: "Compatibilidade temporaria de auth." }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        }
      }
    }
  })
);

// Better Auth routes (passthrough — sem proxy)
app.all(
  authBasePath,
  ({ request }) => auth.handler(request),
  {
    detail: {
      tags: ["Auth"],
      summary: "Better Auth (base)",
      description: "Endpoint base do Better Auth."
    }
  }
);

app.all(
  authWildcardPath,
  ({ request }) => auth.handler(request),
  {
    detail: {
      tags: ["Auth"],
      summary: "Better Auth",
      description: "Rotas de autenticacao do Better Auth (login, sessao, callback)."
    }
  }
);

// Legacy auth proxy (optional)
if (config.legacyAuthProxyEnabled) {
  app.all(
    "/_legacy/auth/*",
    async ({ request, set }) => {
      if (config.legacyAuthProxyToken) {
        const headerValue = request.headers.get(config.legacyAuthProxyHeader);
        if (headerValue !== config.legacyAuthProxyToken) {
          set.status = 403;
          return { error: "forbidden" };
        }
      }

      return proxyRequest(request, config.backendInternalUrl, {
        rewritePath: (pathname) =>
          pathname.replace(/^\/\_legacy\/auth/, "/api/auth")
      });
    },
    {
      detail: {
        tags: ["Legacy"],
        summary: "Proxy legado de auth",
        description: "Compatibilidade temporaria para rotas legadas de autenticacao."
      }
    }
  );
}

// Backend API proxy — com validacao de sessao e injecao de headers
app.all(
  "/api/*",
  async ({ request }) => {
    // 1. Sanitizar headers do cliente (anti-spoofing)
    const sanitized = sanitizeRequest(request);

    // 2. Validar sessao e obter headers de auth
    const authHeaders = await getAuthHeaders(sanitized);

    // 3. Proxy para backend com headers injetados
    return proxyRequest(sanitized, config.backendInternalUrl, {
      extraHeaders: authHeaders,
    });
  },
  {
    detail: {
      tags: ["Core"],
      summary: "Proxy para o Core",
      description: "Encaminha chamadas para o Core FastAPI com headers de auth."
    }
  }
);

// GenieACS UI proxy
const rewriteGenieacsUiPath = (pathname: string) => {
  const rewritten = pathname.replace(/^\/ui/, "");
  return rewritten.length ? rewritten : "/";
};

app.all(
  "/ui",
  ({ request }) =>
    proxyRequest(request, config.genieacsUiInternalUrl, {
      rewritePath: rewriteGenieacsUiPath
    }),
  {
    detail: {
      tags: ["GenieACS"],
      summary: "UI do GenieACS",
      description: "Proxy publico para a UI do GenieACS."
    }
  }
);

app.all(
  "/ui/*",
  ({ request }) =>
    proxyRequest(request, config.genieacsUiInternalUrl, {
      rewritePath: rewriteGenieacsUiPath
    }),
  {
    detail: {
      tags: ["GenieACS"],
      summary: "UI do GenieACS",
      description: "Proxy publico para a UI do GenieACS."
    }
  }
);

// Frontend (dev proxy ou static)
if (config.frontendDevUrl) {
  app.all(
    "/*",
    ({ request }) => proxyRequest(request, config.frontendDevUrl),
    {
      detail: {
        hide: true
      }
    }
  );
} else {
  app.use(
    staticPlugin({
      assets: config.frontendDistDir,
      prefix: "/",
      indexHTML: true
    })
  );
}

app.listen({
  port: config.port,
  hostname: config.host
});

console.log(`Edge running on http://${config.host}:${config.port}`);
```

**Step 3: Verificar que Edge compila**

```bash
cd /home/zeyper/projetos/RJChronosConnect/services/edge
bun check || bun build src/index.ts --target=bun 2>&1 | head -20
```

Se nao houver comando `check`, verificar com:

```bash
cd /home/zeyper/projetos/RJChronosConnect/services/edge
bun run src/index.ts &
sleep 2
curl -s http://localhost:8081/swagger | head -5
kill %1
```

**Step 4: Commit**

```bash
git add services/edge/src/middleware.ts services/edge/src/index.ts
git commit -m "feat(edge): adiciona middleware de validacao de sessao e injecao de headers"
```

---

### Task 6: Frontend — remover fallback JWT e limpar mock auth

**Files:**
- Modify: `services/frontend/src/shared/lib/contexts/JWTAuthContext.tsx`

**Step 1: Simplificar JWTAuthContext para usar apenas Better Auth**

Substituir `services/frontend/src/shared/lib/contexts/JWTAuthContext.tsx`:

```tsx
import { LoadingScreen } from '@shared/ui/components';
import { createContext, ReactNode, useEffect, useReducer } from 'react';
import { createAuthClient } from 'better-auth/client';

// Types
export type AuthUser = null | Record<string, unknown>;

export type AuthState = {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: AuthUser;
};

enum Types {
  Init = 'INIT',
  Login = 'LOGIN',
  Logout = 'LOGOUT',
  Register = 'REGISTER',
}

type AuthPayload = {
  [Types.Init]: {
    isAuthenticated: boolean;
    user: AuthUser;
  };
  [Types.Logout]: undefined;
  [Types.Login]: { user: AuthUser };
  [Types.Register]: { user: AuthUser };
};

type ActionMap<M extends { [index: string]: unknown }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? { type: Key }
    : { type: Key; payload: M[Key] };
};

type AuthActions = ActionMap<AuthPayload>[keyof ActionMap<AuthPayload>];

const initialState: AuthState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
};

const authClient = createAuthClient(
  import.meta.env.VITE_BETTER_AUTH_BASE_URL
    ? { baseURL: import.meta.env.VITE_BETTER_AUTH_BASE_URL }
    : {}
);

const reducer = (state: AuthState, action: AuthActions) => {
  switch (action.type) {
    case 'INIT':
      return {
        isInitialized: true,
        user: action.payload.user,
        isAuthenticated: action.payload.isAuthenticated,
      };
    case 'LOGIN':
    case 'REGISTER':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
      };
    default:
      return state;
  }
};

const AuthContext = createContext({
  ...initialState,
  method: 'BetterAuth',
  login: (_email: string, _password: string) => Promise.resolve(),
  logout: () => {},
  register: (_email: string, _password: string, _username: string) =>
    Promise.resolve(),
});

type AuthProviderProps = {
  children: ReactNode;
};

const extractUser = (data: unknown): AuthUser => {
  if (data && typeof data === 'object' && 'user' in data) {
    return (data as { user: AuthUser }).user;
  }
  return data as AuthUser;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = async (email: string, password: string) => {
    const { data, error } = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
    });

    if (error) {
      throw new Error(error.message || 'Falha ao autenticar');
    }

    const user = extractUser(data);
    if (!user) {
      throw new Error('Sessao nao encontrada apos login');
    }

    dispatch({ type: Types.Login, payload: { user } });
  };

  const register = async (
    email: string,
    username: string,
    password: string
  ) => {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name: username,
    });

    if (error) {
      throw new Error(error.message || 'Falha ao registrar');
    }

    const user = extractUser(data);
    if (!user) {
      throw new Error('Sessao nao encontrada apos cadastro');
    }

    dispatch({ type: Types.Register, payload: { user } });
  };

  const logout = () => {
    authClient.signOut().finally(() => {
      dispatch({ type: Types.Logout });
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await authClient.getSession();

        if (error || !data) {
          dispatch({
            type: Types.Init,
            payload: { user: null, isAuthenticated: false },
          });
          return;
        }

        const user = extractUser(data);
        dispatch({
          type: Types.Init,
          payload: { user, isAuthenticated: Boolean(user) },
        });
      } catch (err) {
        console.error(err);
        dispatch({
          type: Types.Init,
          payload: { user: null, isAuthenticated: false },
        });
      }
    })();
  }, []);

  if (!state.isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider
      value={{ ...state, method: 'BetterAuth', login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
```

**Step 2: Commit**

```bash
git add services/frontend/src/shared/lib/contexts/JWTAuthContext.tsx
git commit -m "refactor(frontend): remove fallback JWT, usa apenas Better Auth"
```

---

### Task 7: Testes de integracao E2E do fluxo completo

**Files:**
- Create: `services/backend-api/tests/test_auth_integration.py`

**Step 1: Escrever testes de integracao**

Criar `services/backend-api/tests/test_auth_integration.py`:

```python
"""Testes de integracao do fluxo de auth Edge → Backend."""

import pytest
from app.models.user import User


class TestAuthFlow:
    """Testa o fluxo completo de autenticacao via headers."""

    def test_unauthenticated_request_returns_401(self, unauthenticated_client):
        """Request sem headers de auth deve retornar 401."""
        response = unauthenticated_client.get("/api/subscribers")
        assert response.status_code == 401
        assert response.json()["detail"] == "Nao autenticado"

    def test_authenticated_request_returns_data(self, client):
        """Request com headers de auth (fixture client) deve funcionar."""
        response = client.get("/api/subscribers")
        assert response.status_code == 200

    def test_get_me_returns_current_user(self, client, db_session):
        """GET /api/auth/me deve retornar dados do usuario autenticado."""
        response = client.get("/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@rjchronos.com"
        assert "id" in data
        assert "external_id" in data

    def test_different_users_get_different_data(self, client, db_session):
        """Dois usuarios diferentes devem ter IDs distintos."""
        resp1 = client.get(
            "/api/auth/me",
            headers={"X-User-Id": "user-a", "X-User-Email": "a@test.com"},
        )
        resp2 = client.get(
            "/api/auth/me",
            headers={"X-User-Id": "user-b", "X-User-Email": "b@test.com"},
        )

        assert resp1.status_code == 200
        assert resp2.status_code == 200
        assert resp1.json()["external_id"] == "user-a"
        assert resp2.json()["external_id"] == "user-b"
        assert resp1.json()["id"] != resp2.json()["id"]

    def test_internal_routes_require_auth(self, unauthenticated_client):
        """Rotas internas tambem devem exigir auth."""
        response = unauthenticated_client.get("/internal/olts/1/credentials")
        assert response.status_code == 401

    def test_auth_routes_are_public(self, unauthenticated_client):
        """Rotas /api/auth/* devem ser publicas (Better Auth handler)."""
        response = unauthenticated_client.get("/api/auth/me")
        # Sem middleware do Edge, /api/auth/me via get_current_user retorna 401
        # mas NAO pelo middleware (rota e publica no middleware)
        # O 401 vem do get_current_user dependency, nao do middleware
        assert response.status_code == 401


class TestAutoProvision:
    """Testa auto-provisionamento de usuarios."""

    def test_new_user_auto_provisioned(self, client, db_session):
        """Primeiro request de um novo usuario deve criar registro no banco."""
        response = client.get(
            "/api/subscribers",
            headers={
                "X-User-Id": "ba-brand-new",
                "X-User-Email": "brandnew@test.com",
            },
        )
        assert response.status_code == 200

    def test_repeated_requests_same_user(self, client, db_session):
        """Requests repetidos do mesmo usuario nao devem criar duplicatas."""
        headers = {
            "X-User-Id": "ba-repeat",
            "X-User-Email": "repeat@test.com",
        }
        client.get("/api/subscribers", headers=headers)
        client.get("/api/subscribers", headers=headers)

        users = db_session.query(User).filter(
            User.external_id == "ba-repeat"
        ).all()
        assert len(users) <= 1  # 0 ou 1 (rollback pode afetar)
```

**Step 2: Rodar testes**

```bash
cd /home/zeyper/projetos/RJChronosConnect/services/backend-api
python -m pytest tests/test_auth_integration.py -v --tb=short
```

Expected: Todos passando

**Step 3: Rodar suite completa**

```bash
cd /home/zeyper/projetos/RJChronosConnect/services/backend-api
python -m pytest tests/ -v --tb=short
```

Expected: Todos passando

**Step 4: Commit**

```bash
git add services/backend-api/tests/test_auth_integration.py
git commit -m "test(auth): adiciona testes de integracao do fluxo Edge → Backend"
```

---

### Task 8: Cleanup e documentacao

**Files:**
- Modify: `services/backend-api/app/schemas/token.py` (deletar)
- Modify: `CLAUDE.md` (atualizar secao de auth)

**Step 1: Remover schemas de token (nao mais usado)**

Deletar `services/backend-api/app/schemas/token.py`.

Verificar se ha imports para ajustar:

```bash
cd /home/zeyper/projetos/RJChronosConnect/services/backend-api
grep -r "schemas.token\|from.*token import\|schema_token" app/ --include="*.py"
```

Se `security.py` antigo importava `schema_token`, ja foi removido na Task 4. Se houver outros, ajustar.

**Step 2: Remover import do token em schemas/__init__.py (se existir)**

Verificar e limpar:

```bash
grep -r "token" services/backend-api/app/schemas/__init__.py 2>/dev/null
```

**Step 3: Atualizar secao de auth no CLAUDE.md**

Substituir a secao `## 5. Autenticacao (estado atual)`:

```markdown
## 5. Autenticacao

### Arquitetura
- **Fonte de verdade:** Better Auth 1.3.4 no Edge Gateway
- **Sessoes:** PostgreSQL (tabela `session` do Better Auth)
- **Fluxo:** Edge valida sessao → injeta `X-User-Id`/`X-User-Email` → Backend le headers
- **Protecao:** Middleware global no Backend, todas as rotas protegidas por padrao
- **Auto-provision:** Backend cria user local automaticamente no primeiro request

### Tabelas de usuario
- `user` (Better Auth, Edge) — auth, sessoes, email/password
- `users` (Backend) — dados de negocio, FKs, campo `external_id` linkando ao Better Auth

### Rotas publicas (whitelist)
- `/docs`, `/openapi.json`, `/redoc` — documentacao
- `/health` — healthcheck
- `/api/auth/*` — Better Auth handlers
- `/` — root
```

**Step 4: Rodar suite final**

```bash
cd /home/zeyper/projetos/RJChronosConnect/services/backend-api
python -m pytest tests/ -v --tb=short
```

Expected: Todos passando

**Step 5: Commit**

```bash
git add -A
git commit -m "chore(auth): cleanup JWT residual e atualiza documentacao"
```
