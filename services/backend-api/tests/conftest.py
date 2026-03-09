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
