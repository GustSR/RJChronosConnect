"""Fixtures base para testes do serviço works."""
import pytest


@pytest.fixture()
def base_event():
    """Evento base de provisionamento com todos os campos."""
    return {
        "event_type": "provisioning",
        "task_id": "test-task-001",
        "olt_id": 1,
        "port": "0/1/0",
        "ont_id": 5,
        "serial_number": "HWTC99990001",
        "line_profile": "SMARTOLT_FLEXIBLE_GPON",
        "srv_profile": "EG8145V5",
        "description": "Cliente Teste",
        "vlan_id": 106,
        "mgmt_vlan": 200,
        "wan_mode": "dhcp",
        "tr069_profile_id": 2,
        "create_mgmt_service_port": False,
    }
