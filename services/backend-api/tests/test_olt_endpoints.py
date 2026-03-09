"""Testes dos endpoints CRUD de OLT (/api/olts/)."""

import pytest

BASE_URL = "/api/olts"


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
    response = client.post(f"{BASE_URL}/", json=payload)
    assert response.status_code == 201
    return response.json()


# ── Task 4: TestCreateOLT ────────────────────────────────────────────────


class TestCreateOLT:
    """Testes de criacao de OLT (POST /api/olts/)."""

    def test_create_olt_returns_201(self, client):
        payload = {
            "name": "OLT-CREATE-01",
            "ip_address": "10.0.0.1",
            "vendor": "Huawei",
            "model": "MA5600T",
        }
        response = client.post(f"{BASE_URL}/", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["ip_address"] == payload["ip_address"]
        assert data["vendor"] == payload["vendor"]
        assert data["model"] == payload["model"]
        assert data["setup_status"] == "pending"
        assert data["is_configured"] is False
        assert "id" in data
        assert "created_at" in data

    def test_create_olt_duplicate_name_returns_400(self, client):
        base = {
            "name": "OLT-DUP-NAME",
            "ip_address": "10.0.1.1",
            "vendor": "Huawei",
            "model": "MA5600T",
        }
        client.post(f"{BASE_URL}/", json=base)

        duplicate = {**base, "ip_address": "10.0.1.2"}
        response = client.post(f"{BASE_URL}/", json=duplicate)

        assert response.status_code == 400

    def test_create_olt_duplicate_ip_returns_400(self, client):
        base = {
            "name": "OLT-DUP-IP-1",
            "ip_address": "10.0.2.1",
            "vendor": "Huawei",
            "model": "MA5600T",
        }
        client.post(f"{BASE_URL}/", json=base)

        duplicate = {**base, "name": "OLT-DUP-IP-2"}
        response = client.post(f"{BASE_URL}/", json=duplicate)

        assert response.status_code == 400

    def test_create_olt_with_credentials(self, client):
        payload = {
            "name": "OLT-CREDS",
            "ip_address": "10.0.3.1",
            "vendor": "ZTE",
            "model": "C320",
            "ssh_username": "admin",
            "ssh_password": "secret123",
            "ssh_port": 2222,
            "access_protocol": "ssh",
        }
        response = client.post(f"{BASE_URL}/", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["ssh_username"] == "admin"
        assert data["ssh_port"] == 2222
        assert data["access_protocol"] == "ssh"

    def test_create_olt_with_vlan_config(self, client):
        payload = {
            "name": "OLT-VLAN",
            "ip_address": "10.0.4.1",
            "vendor": "Huawei",
            "model": "MA5608T",
            "mgmt_vlan": 100,
            "service_vlan": 500,
            "create_mgmt_service_port": True,
        }
        response = client.post(f"{BASE_URL}/", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["mgmt_vlan"] == 100
        assert data["service_vlan"] == 500
        assert data["create_mgmt_service_port"] is True


# ── Task 5: TestListOLTs ─────────────────────────────────────────────────


class TestListOLTs:
    """Testes de listagem de OLTs (GET /api/olts/)."""

    def test_list_olts_empty(self, client):
        response = client.get(f"{BASE_URL}/")

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_list_olts_returns_created(self, client, sample_olt):
        response = client.get(f"{BASE_URL}/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        names = [olt["name"] for olt in data]
        assert sample_olt["name"] in names

    def test_list_olts_with_pagination(self, client):
        # Cria duas OLTs para garantir que a paginacao funcione
        client.post(f"{BASE_URL}/", json={
            "name": "OLT-PAGE-1",
            "ip_address": "10.1.0.1",
            "vendor": "Huawei",
            "model": "MA5600T",
        })
        client.post(f"{BASE_URL}/", json={
            "name": "OLT-PAGE-2",
            "ip_address": "10.1.0.2",
            "vendor": "Huawei",
            "model": "MA5600T",
        })

        response = client.get(f"{BASE_URL}/", params={"skip": 0, "limit": 1})

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1


# ── Task 5: TestGetOLT ───────────────────────────────────────────────────


class TestGetOLT:
    """Testes de obtencao de OLT por ID (GET /api/olts/{{id}})."""

    def test_get_olt_by_id(self, client, sample_olt):
        olt_id = sample_olt["id"]
        response = client.get(f"{BASE_URL}/{olt_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == olt_id
        assert data["name"] == sample_olt["name"]
        assert data["ip_address"] == sample_olt["ip_address"]

    def test_get_olt_not_found(self, client):
        response = client.get(f"{BASE_URL}/99999")

        assert response.status_code == 404


# ── Task 6: TestUpdateOLT ────────────────────────────────────────────────


class TestUpdateOLT:
    """Testes de atualizacao de OLT (PUT /api/olts/{{id}})."""

    def test_update_olt_name(self, client, sample_olt):
        olt_id = sample_olt["id"]
        response = client.put(
            f"{BASE_URL}/{olt_id}",
            json={"name": "OLT-RENAMED"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "OLT-RENAMED"
        # Campos nao alterados permanecem iguais
        assert data["ip_address"] == sample_olt["ip_address"]
        assert data["vendor"] == sample_olt["vendor"]

    def test_update_olt_vlan(self, client, sample_olt):
        olt_id = sample_olt["id"]
        response = client.put(
            f"{BASE_URL}/{olt_id}",
            json={"mgmt_vlan": 300, "service_vlan": 600},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["mgmt_vlan"] == 300
        assert data["service_vlan"] == 600

    def test_update_olt_not_found(self, client):
        response = client.put(
            f"{BASE_URL}/99999",
            json={"name": "OLT-GHOST"},
        )

        assert response.status_code == 404


# ── Task 6: TestDeleteOLT ────────────────────────────────────────────────


class TestDeleteOLT:
    """Testes de remocao de OLT (DELETE /api/olts/{{id}})."""

    def test_delete_olt(self, client, sample_olt):
        olt_id = sample_olt["id"]

        del_response = client.delete(f"{BASE_URL}/{olt_id}")
        assert del_response.status_code == 200

        get_response = client.get(f"{BASE_URL}/{olt_id}")
        assert get_response.status_code == 404

    def test_delete_olt_not_found(self, client):
        response = client.delete(f"{BASE_URL}/99999")

        assert response.status_code == 404


# ── Task 7: TestOLTFilters ───────────────────────────────────────────────


class TestOLTFilters:
    """Testes de filtros de OLT (query params setup_status, configured_only)."""

    def test_filter_by_setup_status(self, client, sample_olt):
        response = client.get(f"{BASE_URL}/", params={"setup_status": "pending"})

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        for olt in data:
            assert olt["setup_status"] == "pending"

    def test_filter_unconfigured(self, client, sample_olt):
        response = client.get(f"{BASE_URL}/", params={"configured_only": False})

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        for olt in data:
            assert olt["is_configured"] is False
