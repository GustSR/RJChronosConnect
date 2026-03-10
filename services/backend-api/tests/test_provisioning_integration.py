"""
Teste de integração ponta-a-ponta do fluxo de provisionamento.
Simula: POST authorize-async → PUT callback do worker → GET clients
"""
import pytest
from unittest.mock import patch

from app.models.olt import Olt
from app.models.device import Device
from app.models.device_status import DeviceStatus
from app.models.subscriber import Subscriber


@pytest.fixture()
def device_status_active(db_session):
    status = db_session.query(DeviceStatus).filter(DeviceStatus.name == "ativo").first()
    if not status:
        status = DeviceStatus(id=1, name="ativo")
        db_session.add(status)
        db_session.commit()
        db_session.refresh(status)
    return status


@pytest.fixture()
def configured_olt(db_session):
    olt = Olt(
        name="OLT-Integ",
        ip_address="10.0.0.50",
        vendor="Huawei",
        model="MA5800-X7",
        ssh_username="admin",
        ssh_password="secret",
        is_configured=True,
        mgmt_vlan=200,
        service_vlan=106,
    )
    db_session.add(olt)
    db_session.commit()
    db_session.refresh(olt)
    return olt


@patch("app.api.provisioning.send_provisioning_task", return_value="integ-task-001")
def test_fluxo_completo_provisioning(mock_send, client, db_session, device_status_active, configured_olt):
    """
    Fluxo completo simulado:
    1. POST /authorize-async → cria Subscriber + Device + OltPort no DB
    2. PUT /clients/serial/{sn} → simula callback do worker atualizando ont_id
    3. GET /clients → verifica device com ont_id correto
    """
    # 1. Autorização assíncrona
    payload = {
        "client_name": "Integração Teste",
        "client_cpf_cnpj": "77788899900",
        "client_address": "Rua Integração, 42",
        "serial_number": "INTEG_SN_001",
        "olt_id": configured_olt.id,
        "slot": 0,
        "port": 3,
        "ont_id": None,
        "onu_type": "EG8145V5",
    }

    resp1 = client.post("/api/provisioning/INTEG_SN_001/authorize-async", json=payload)
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["success"] is True
    assert data1["task_id"] == "integ-task-001"
    device_id = data1["device_id"]

    # Verificar entidades no DB
    sub = db_session.query(Subscriber).filter(Subscriber.cpf_cnpj == "77788899900").first()
    assert sub is not None
    assert sub.full_name == "Integração Teste"

    dev = db_session.query(Device).filter(Device.serial_number == "INTEG_SN_001").first()
    assert dev is not None
    assert dev.id == device_id
    assert dev.ont_id is None  # Worker ainda não atualizou

    # 2. Simular callback do worker (PUT /clients/serial/{sn})
    resp2 = client.put("/api/provisioning/clients/serial/INTEG_SN_001", json={"ont_id": 5})
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["ont_id"] == 5

    # 3. Verificar via GET /clients
    resp3 = client.get("/api/provisioning/clients")
    assert resp3.status_code == 200
    clients = resp3.json()
    matching = [c for c in clients if c["serial_number"] == "INTEG_SN_001"]
    assert len(matching) == 1
    assert matching[0]["ont_id"] == 5
    assert matching[0]["customer_name"] == "Integração Teste"
