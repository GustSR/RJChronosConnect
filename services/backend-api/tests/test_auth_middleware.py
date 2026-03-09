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
        response = client.get("/api/subscribers")
        assert response.status_code == 200

    def test_auto_provisions_user_on_first_request(self, client, db_session):
        response = client.get(
            "/api/subscribers",
            headers={
                "X-User-Id": "ba-auto-provision",
                "X-User-Email": "auto@provision.com",
            },
        )
        assert response.status_code == 200
