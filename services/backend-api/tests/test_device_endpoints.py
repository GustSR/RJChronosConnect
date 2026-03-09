"""Testes dos endpoints de Devices (/api/devices/)."""

import pytest
from unittest.mock import patch, AsyncMock

from app.models.device import Device
from app.models.device_status import DeviceStatus
from app.models.olt import Olt
from app.models.olt_port import OltPort
from app.models.subscriber import Subscriber

BASE_URL = "/api/devices"


# ── Fixtures ────────────────────────────────────────────────────────────


@pytest.fixture()
def seed_device_statuses(db_session):
    """Popula tabela lookup device_statuses com os valores padrao."""
    status_names = [
        "ativo",
        "offline",
        "em_manutencao",
        "desabilitado",
        "desconhecido",
        "provisionando",
    ]
    statuses = []
    for name in status_names:
        status = DeviceStatus(name=name)
        db_session.add(status)
        statuses.append(status)
    db_session.flush()
    return statuses


@pytest.fixture()
def sample_olt_with_port(db_session):
    """Cria OLT + OltPort para associar devices."""
    olt = Olt(
        name="OLT-DEVICE-TEST",
        ip_address="10.99.0.1",
        vendor="Huawei",
        model="MA5600T",
    )
    db_session.add(olt)
    db_session.flush()

    port = OltPort(olt_id=olt.id, slot=0, port_number=1)
    db_session.add(port)
    db_session.flush()

    return {"olt": olt, "port": port}


@pytest.fixture()
def sample_subscriber(db_session):
    """Cria subscriber para associar devices."""
    subscriber = Subscriber(
        full_name="Assinante Device Test",
        cpf_cnpj="00011122233",
    )
    db_session.add(subscriber)
    db_session.flush()
    return subscriber


@pytest.fixture()
def sample_device(db_session, seed_device_statuses, sample_olt_with_port, sample_subscriber):
    """Cria um device com todas as dependencias."""
    # status_id = 1 corresponde a 'ativo' (primeiro seed)
    ativo_status = seed_device_statuses[0]
    port = sample_olt_with_port["port"]

    device = Device(
        serial_number="HWTC-AABBCCDD",
        subscriber_id=sample_subscriber.id,
        olt_port_id=port.id,
        status_id=ativo_status.id,
        ont_id=0,
    )
    db_session.add(device)
    db_session.flush()
    return device


# ── TestListONUs ────────────────────────────────────────────────────────


class TestListONUs:
    """Testes de listagem de ONUs (GET /api/devices/onus)."""

    def test_list_onus_empty(self, client):
        """Sem devices no banco, deve retornar 200 com lista vazia."""
        response = client.get(f"{BASE_URL}/onus")

        assert response.status_code == 200
        assert response.json() == []

    def test_list_onus_returns_created(self, client, sample_device):
        """Com device criado, GET /onus deve retornar a lista com o device."""
        response = client.get(f"{BASE_URL}/onus")

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["serial_number"] == "HWTC-AABBCCDD"


# ── TestListOLTs (via devices router) ───────────────────────────────────


class TestListOLTs:
    """Testes de listagem de OLTs via router de devices (GET /api/devices/olts)."""

    def test_list_olts_via_devices_empty(self, client):
        """Sem OLTs no banco, deve retornar 200 com lista vazia."""
        response = client.get(f"{BASE_URL}/olts")

        assert response.status_code == 200
        assert response.json() == []

    def test_list_olts_via_devices_returns_created(self, client, sample_olt_with_port):
        """Com OLT criada, GET /olts deve retornar a lista com a OLT."""
        response = client.get(f"{BASE_URL}/olts")

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["name"] == "OLT-DEVICE-TEST"


# ── TestOLTStats ────────────────────────────────────────────────────────


class TestOLTStats:
    """Testes de estatisticas de OLT (GET /api/devices/olts/{olt_id}/stats)."""

    def test_get_olt_stats(self, client, sample_device, sample_olt_with_port):
        """Deve retornar total/online/offline para a OLT."""
        olt_id = sample_olt_with_port["olt"].id
        response = client.get(f"{BASE_URL}/olts/{olt_id}/stats")

        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "online" in data
        assert "offline" in data
        assert isinstance(data["total"], int)
        assert isinstance(data["online"], int)
        assert isinstance(data["offline"], int)
        assert data["total"] == data["online"] + data["offline"]

    def test_get_olt_stats_empty(self, client, sample_olt_with_port):
        """OLT sem devices deve retornar contagens zeradas."""
        olt_id = sample_olt_with_port["olt"].id
        response = client.get(f"{BASE_URL}/olts/{olt_id}/stats")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["online"] == 0
        assert data["offline"] == 0

    def test_get_olt_stats_not_found(self, client):
        """OLT inexistente deve retornar 404."""
        response = client.get(f"{BASE_URL}/olts/99999/stats")

        assert response.status_code == 404


# ── TestDeleteONU ───────────────────────────────────────────────────────


class TestDeleteONU:
    """Testes de delecao de ONU (DELETE /api/devices/onus/{device_id})."""

    def test_delete_onu_not_found(self, client):
        """Device inexistente deve retornar 404."""
        response = client.delete(f"{BASE_URL}/onus/99999")

        assert response.status_code == 404

    @patch("app.api.devices.delete_olt_manager", new_callable=AsyncMock)
    def test_delete_onu_success(self, mock_delete_olt, client, sample_device, db_session):
        """Deve deletar o device do banco apos chamar olt_manager."""
        mock_delete_olt.return_value = {"success": True}

        device_id = sample_device.id
        response = client.delete(f"{BASE_URL}/onus/{device_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        # Verifica que o device foi removido do banco
        deleted = db_session.query(Device).filter(Device.id == device_id).first()
        assert deleted is None

        # Verifica que o mock foi chamado
        mock_delete_olt.assert_called_once()

    @patch("app.api.devices.delete_olt_manager", new_callable=AsyncMock)
    def test_delete_onu_olt_manager_fails_still_deletes(
        self, mock_delete_olt, client, sample_device, db_session
    ):
        """Mesmo se olt_manager falhar, device deve ser removido do banco."""
        mock_delete_olt.return_value = {"success": False, "error": "timeout"}

        device_id = sample_device.id
        response = client.delete(f"{BASE_URL}/onus/{device_id}")

        assert response.status_code == 200

        deleted = db_session.query(Device).filter(Device.id == device_id).first()
        assert deleted is None
