"""
Testes dos endpoints de provisionamento (Backend API).
Cobre: authorize-async, clients CRUD, reject, task status.
"""
import pytest
from unittest.mock import patch, MagicMock

from app.models.olt import Olt
from app.models.olt_port import OltPort
from app.models.device import Device
from app.models.device_status import DeviceStatus
from app.models.subscriber import Subscriber


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def device_status_active(db_session):
    """Cria DeviceStatus 'ativo' com id=1."""
    status = db_session.query(DeviceStatus).filter(DeviceStatus.name == "ativo").first()
    if not status:
        status = DeviceStatus(id=1, name="ativo")
        db_session.add(status)
        db_session.commit()
        db_session.refresh(status)
    return status


@pytest.fixture()
def configured_olt(db_session):
    """OLT configurada com credenciais SSH e VLANs."""
    olt = Olt(
        name="OLT-Teste-Prov",
        ip_address="10.0.0.99",
        vendor="Huawei",
        model="MA5800-X7",
        ssh_username="admin",
        ssh_password="secret123",
        is_configured=True,
        mgmt_vlan=200,
        service_vlan=106,
        create_mgmt_service_port=False,
    )
    db_session.add(olt)
    db_session.commit()
    db_session.refresh(olt)
    return olt


@pytest.fixture()
def provision_payload(configured_olt):
    """Payload padrão para authorize-async."""
    return {
        "client_name": "João da Silva",
        "client_cpf_cnpj": "12345678901",
        "client_address": "Rua Teste, 123",
        "serial_number": "HWTC12345678",
        "olt_id": configured_olt.id,
        "slot": 0,
        "port": 1,
        "ont_id": 5,
        "onu_type": "EG8145V5",
    }


# ---------------------------------------------------------------------------
# Testes authorize-async
# ---------------------------------------------------------------------------

@patch("app.api.provisioning.send_provisioning_task", return_value="fake-task-id")
def test_authorize_async_creates_entities(mock_send, client, db_session, device_status_active, configured_olt, provision_payload):
    """authorize-async com dados válidos cria Subscriber + Device + OltPort no DB."""
    resp = client.post(f"/api/provisioning/{provision_payload['serial_number']}/authorize-async", json=provision_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "task_id" in data
    assert "device_id" in data

    # Verificar entidades criadas
    sub = db_session.query(Subscriber).filter(Subscriber.cpf_cnpj == "12345678901").first()
    assert sub is not None
    assert sub.full_name == "João da Silva"

    dev = db_session.query(Device).filter(Device.serial_number == "HWTC12345678").first()
    assert dev is not None
    assert dev.subscriber_id == sub.id
    assert dev.ont_id == 5


@patch("app.api.provisioning.send_provisioning_task", return_value="fake-task-id")
def test_authorize_async_olt_not_found(mock_send, client, db_session, device_status_active):
    """authorize-async com OLT inexistente retorna erro."""
    payload = {
        "client_name": "Maria",
        "client_address": "Rua X",
        "olt_id": 99999,
        "serial_number": "SN_INEXIST",
    }
    resp = client.post("/api/provisioning/SN_INEXIST/authorize-async", json=payload)
    assert resp.status_code == 404 or resp.status_code == 500
    mock_send.assert_not_called()


@patch("app.api.provisioning.send_provisioning_task", return_value="fake-task-id")
def test_authorize_async_existing_device_updates_binding(mock_send, client, db_session, device_status_active, configured_olt, provision_payload):
    """authorize-async com device existente atualiza vínculo (não duplica)."""
    # Criar subscriber e device previamente
    sub = Subscriber(full_name="Antigo", cpf_cnpj="99988877766", address_street="Rua Velha")
    db_session.add(sub)
    db_session.commit()
    db_session.refresh(sub)

    olt_port = OltPort(olt_id=configured_olt.id, slot=0, port_number=1)
    db_session.add(olt_port)
    db_session.commit()
    db_session.refresh(olt_port)

    existing = Device(serial_number="HWTC12345678", subscriber_id=sub.id, olt_port_id=olt_port.id, status_id=1)
    db_session.add(existing)
    db_session.commit()
    db_session.refresh(existing)
    original_id = existing.id

    resp = client.post(f"/api/provisioning/HWTC12345678/authorize-async", json=provision_payload)
    assert resp.status_code == 200

    # Não duplicou
    devs = db_session.query(Device).filter(Device.serial_number == "HWTC12345678").all()
    assert len(devs) == 1
    assert devs[0].id == original_id


@patch("app.api.provisioning.send_provisioning_task", return_value="fake-task-id")
def test_authorize_async_existing_subscriber_reuses(mock_send, client, db_session, device_status_active, configured_olt, provision_payload):
    """authorize-async com subscriber existente (CPF) reutiliza."""
    sub = Subscriber(full_name="João Existente", cpf_cnpj="12345678901", address_street="Rua Antiga")
    db_session.add(sub)
    db_session.commit()
    db_session.refresh(sub)
    original_sub_id = sub.id

    resp = client.post(f"/api/provisioning/HWTC12345678/authorize-async", json=provision_payload)
    assert resp.status_code == 200

    dev = db_session.query(Device).filter(Device.serial_number == "HWTC12345678").first()
    assert dev.subscriber_id == original_sub_id


@patch("app.api.provisioning.send_provisioning_task", return_value="fake-task-id-abc")
def test_authorize_async_returns_task_and_device_id(mock_send, client, db_session, device_status_active, configured_olt, provision_payload):
    """authorize-async retorna task_id e device_id."""
    resp = client.post(f"/api/provisioning/HWTC12345678/authorize-async", json=provision_payload)
    data = resp.json()
    assert data["task_id"] == "fake-task-id-abc"
    assert isinstance(data["device_id"], int)
    assert data["status"] == "queued"


@patch("app.api.provisioning.send_provisioning_task", return_value="fake-task-id")
def test_authorize_async_uses_onu_id_as_fallback_serial(mock_send, client, db_session, device_status_active, configured_olt):
    """authorize-async sem serial_number usa onu_id como fallback."""
    payload = {
        "client_name": "Sem Serial",
        "client_address": "Rua Fallback",
        "olt_id": configured_olt.id,
        "slot": 0,
        "port": 1,
        "ont_id": 3,
    }
    resp = client.post("/api/provisioning/MY-ONU-ID/authorize-async", json=payload)
    assert resp.status_code == 200

    dev = db_session.query(Device).filter(Device.serial_number == "MY-ONU-ID").first()
    assert dev is not None


# ---------------------------------------------------------------------------
# Testes PUT /clients/serial/{sn}
# ---------------------------------------------------------------------------

def test_update_ont_id_by_serial(client, db_session, device_status_active, configured_olt):
    """PUT /clients/serial/{sn} atualiza ont_id corretamente."""
    sub = Subscriber(full_name="Test", cpf_cnpj="11122233344", address_street="R")
    db_session.add(sub)
    db_session.commit()
    db_session.refresh(sub)

    port = OltPort(olt_id=configured_olt.id, slot=0, port_number=2)
    db_session.add(port)
    db_session.commit()
    db_session.refresh(port)

    dev = Device(serial_number="SERIAL_UPDATE", subscriber_id=sub.id, olt_port_id=port.id, status_id=1)
    db_session.add(dev)
    db_session.commit()

    resp = client.put("/api/provisioning/clients/serial/SERIAL_UPDATE", json={"ont_id": 42})
    assert resp.status_code == 200
    data = resp.json()
    assert data["ont_id"] == 42

    db_session.refresh(dev)
    assert dev.ont_id == 42


def test_update_ont_id_serial_not_found(client, db_session):
    """PUT /clients/serial/{sn} com serial inexistente retorna 404."""
    resp = client.put("/api/provisioning/clients/serial/NONEXISTENT", json={"ont_id": 10})
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Testes GET /clients e GET /clients/{id}
# ---------------------------------------------------------------------------

def test_get_provisioned_clients(client, db_session, device_status_active, configured_olt):
    """GET /clients retorna devices provisionados com dados do subscriber."""
    sub = Subscriber(full_name="Cliente Lista", cpf_cnpj="55566677788", address_street="Av Teste")
    db_session.add(sub)
    db_session.commit()
    db_session.refresh(sub)

    port = OltPort(olt_id=configured_olt.id, slot=1, port_number=3)
    db_session.add(port)
    db_session.commit()
    db_session.refresh(port)

    dev = Device(serial_number="SERIAL_LIST", subscriber_id=sub.id, olt_port_id=port.id, status_id=1, ont_id=7)
    db_session.add(dev)
    db_session.commit()

    resp = client.get("/api/provisioning/clients")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert any(d["serial_number"] == "SERIAL_LIST" and d["ont_id"] == 7 for d in data)


def test_get_client_by_id(client, db_session, device_status_active, configured_olt):
    """GET /clients/{id} retorna device específico."""
    sub = Subscriber(full_name="Detalhe", cpf_cnpj="99900011122", address_street="Rua D")
    db_session.add(sub)
    db_session.commit()
    db_session.refresh(sub)

    port = OltPort(olt_id=configured_olt.id, slot=0, port_number=4)
    db_session.add(port)
    db_session.commit()
    db_session.refresh(port)

    dev = Device(serial_number="SERIAL_DETAIL", subscriber_id=sub.id, olt_port_id=port.id, status_id=1)
    db_session.add(dev)
    db_session.commit()
    db_session.refresh(dev)

    resp = client.get(f"/api/provisioning/clients/{dev.id}")
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Teste DELETE /{onu_id}/reject
# ---------------------------------------------------------------------------

def test_reject_onu(client):
    """DELETE /{onu_id}/reject retorna success."""
    resp = client.delete("/api/provisioning/ONU-REJECT-123/reject")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True


# ---------------------------------------------------------------------------
# Teste GET /tasks/{task_id}
# ---------------------------------------------------------------------------

@patch("app.api.provisioning.get_task_status")
def test_get_task_status_endpoint(mock_status, client):
    """GET /tasks/{task_id} retorna status da task."""
    mock_status.return_value = {
        "task_id": "abc-123",
        "state": "PENDING",
        "result": None,
        "ready": False,
        "successful": None,
    }
    resp = client.get("/api/provisioning/tasks/abc-123")
    assert resp.status_code == 200
    data = resp.json()
    assert data["task_id"] == "abc-123"
    assert data["state"] == "PENDING"
    mock_status.assert_called_once_with("abc-123")
