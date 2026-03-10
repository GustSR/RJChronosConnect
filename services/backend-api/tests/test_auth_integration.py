"""Testes de integracao do fluxo de auth Edge -> Backend."""

import pytest
from app.models.user import User


class TestAuthFlow:
    """Testa o fluxo completo de autenticacao via headers."""

    def test_unauthenticated_request_returns_401(self, unauthenticated_client):
        response = unauthenticated_client.get("/api/subscribers")
        assert response.status_code == 401
        assert response.json()["detail"] == "Nao autenticado"

    def test_authenticated_request_returns_data(self, client):
        response = client.get("/api/subscribers")
        assert response.status_code == 200

    def test_get_me_returns_current_user(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@rjchronos.com"
        assert "id" in data
        assert "external_id" in data

    def test_different_users_get_different_data(self, client):
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


class TestAutoProvision:
    """Testa auto-provisionamento de usuarios."""

    def test_new_user_auto_provisioned(self, client):
        response = client.get(
            "/api/subscribers",
            headers={
                "X-User-Id": "ba-brand-new",
                "X-User-Email": "brandnew@test.com",
            },
        )
        assert response.status_code == 200

    def test_repeated_requests_same_user(self, client):
        headers = {
            "X-User-Id": "ba-repeat",
            "X-User-Email": "repeat@test.com",
        }
        client.get("/api/subscribers", headers=headers)
        client.get("/api/subscribers", headers=headers)
        # Sem erros significa que nao houve violacao de chave duplicada


class TestPublicRoutes:
    """Testa que rotas publicas funcionam sem autenticacao."""

    def test_health_check_no_auth(self, unauthenticated_client):
        response = unauthenticated_client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_root_no_auth(self, unauthenticated_client):
        response = unauthenticated_client.get("/")
        assert response.status_code == 200

    def test_docs_no_auth(self, unauthenticated_client):
        response = unauthenticated_client.get("/docs")
        assert response.status_code == 200


class TestMissingHeaders:
    """Testa cenarios com headers parciais ou invalidos."""

    def test_missing_user_id_returns_401(self, unauthenticated_client):
        response = unauthenticated_client.get(
            "/api/subscribers",
            headers={"X-User-Email": "orphan@test.com"},
        )
        assert response.status_code == 401

    def test_empty_user_id_returns_401(self, unauthenticated_client):
        response = unauthenticated_client.get(
            "/api/subscribers",
            headers={"X-User-Id": "", "X-User-Email": "empty@test.com"},
        )
        assert response.status_code == 401

    def test_user_id_only_works(self, client):
        """X-User-Email ausente usa fallback para {user_id}@edge.local."""
        response = client.get(
            "/api/subscribers",
            headers={"X-User-Id": "id-only-user"},
        )
        assert response.status_code == 200
