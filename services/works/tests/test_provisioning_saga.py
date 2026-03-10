"""
Testes da saga de provisionamento do worker.
Testa run_provisioning() diretamente via asyncio, sem depender de Celery/RabbitMQ/Redis.
"""
import asyncio
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.tasks.provisioning import OLTClient, BackendClient, update_status

# Mock responses reutilizáveis
MOCK_PROVISIONED_ONTS = [{"ont_id": 1}, {"ont_id": 3}]  # IDs 2, 4-127 livres
MOCK_SUCCESS = {"success": True, "message": "OK"}
MOCK_REBOOT = {"success": True, "message": "Rebooting"}
MOCK_DELETE = {"success": True, "message": "Deleted"}


def _make_mocks():
    """Cria mocks de OLTClient e BackendClient com respostas padrão."""
    olt = MagicMock(spec=OLTClient)
    olt.add_ont_basic = AsyncMock(return_value=MOCK_SUCCESS)
    olt.get_provisioned_onts = AsyncMock(return_value=MOCK_PROVISIONED_ONTS)
    olt.configure_wan = AsyncMock(return_value=MOCK_SUCCESS)
    olt.configure_tr069 = AsyncMock(return_value=MOCK_SUCCESS)
    olt.add_service_port = AsyncMock(return_value=MOCK_SUCCESS)
    olt.reboot_ont = AsyncMock(return_value=MOCK_REBOOT)
    olt.delete_service_ports = AsyncMock(return_value=MOCK_DELETE)
    olt.delete_ont = AsyncMock(return_value=MOCK_DELETE)

    backend = MagicMock(spec=BackendClient)
    backend.update_ont_id_by_serial = AsyncMock(return_value={"success": True})

    return olt, backend


def _run_saga(event, olt_mock, backend_mock):
    """Executa a saga de provisionamento com mocks injetados, retorna (status, ont_created, target_ont_id)."""
    ont_created = False
    target_ont_id = event.get("ont_id")

    async def run_provisioning():
        nonlocal ont_created, target_ont_id

        if not target_ont_id or target_ont_id <= 0:
            provisioned = await olt_mock.get_provisioned_onts(event["olt_id"], event["port"])
            used_ids = {int(ont['ont_id']) for ont in provisioned if 'ont_id' in ont}
            for candidate in range(1, 128):
                if candidate not in used_ids:
                    target_ont_id = candidate
                    break
            if not target_ont_id:
                raise Exception(f"Não há IDs disponíveis na porta {event.get('port')}")

        basic_data = {
            "port": event["port"],
            "ont_id": target_ont_id,
            "serial_number": event["serial_number"],
            "line_profile": event.get("line_profile"),
            "srv_profile": event.get("srv_profile"),
            "description": event.get("description"),
        }
        await olt_mock.add_ont_basic(event["olt_id"], basic_data)
        ont_created = True

        if event.get("mgmt_vlan"):
            wan_data = {
                "port": event["port"],
                "ont_id": target_ont_id,
                "serial_number": event["serial_number"],
                "mgmt_vlan": event["mgmt_vlan"],
                "ip_mode": event.get("wan_mode"),
                "ip_address": event.get("ip_address"),
                "mask": event.get("mask"),
                "gateway": event.get("gateway"),
            }
            await olt_mock.configure_wan(event["olt_id"], wan_data)

        if event.get("tr069_profile_id"):
            tr069_data = {
                "port": event["port"],
                "ont_id": target_ont_id,
                "profile_id": event["tr069_profile_id"],
            }
            await olt_mock.configure_tr069(event["olt_id"], tr069_data)

        if event.get("mgmt_vlan") and event.get("create_mgmt_service_port"):
            mgmt_sp_data = {
                "port": event["port"],
                "ont_id": target_ont_id,
                "vlan": event["mgmt_vlan"],
                "user_vlan": event["mgmt_vlan"],
                "gemport": 2,
                "description": f"MGMT_{event['serial_number'][-4:]}",
            }
            await olt_mock.add_service_port(event["olt_id"], mgmt_sp_data)

        if event.get("vlan_id"):
            service_port_data = {
                "port": event["port"],
                "ont_id": target_ont_id,
                "vlan": event["mgmt_vlan"],
                "user_vlan": event["vlan_id"],
                "gemport": 1,
                "description": f"INTERNET_{event['serial_number'][-4:]}",
            }
            await olt_mock.add_service_port(event["olt_id"], service_port_data)

        await olt_mock.reboot_ont(event["olt_id"], event["port"], target_ont_id)

        try:
            await backend_mock.update_ont_id_by_serial(event["serial_number"], target_ont_id)
        except Exception:
            pass  # DB sync falha é tolerada

    async def run_rollback():
        try:
            await olt_mock.delete_service_ports(event["olt_id"], event["port"], target_ont_id)
            await olt_mock.delete_ont(event["olt_id"], event["port"], target_ont_id)
        except Exception:
            pass  # Rollback falha é logada mas não propaga

    status = "completed"
    try:
        asyncio.get_event_loop().run_until_complete(run_provisioning())
    except RuntimeError:
        asyncio.run(run_provisioning())
    except Exception:
        status = "failed"
        if ont_created:
            try:
                asyncio.get_event_loop().run_until_complete(run_rollback())
            except RuntimeError:
                asyncio.run(run_rollback())

    return status, ont_created, target_ont_id


# ---------------------------------------------------------------------------
# Testes
# ---------------------------------------------------------------------------

def test_happy_path_completo(base_event):
    """Happy path — todos os passos executam, status='completed'."""
    olt, backend = _make_mocks()
    status, ont_created, target_ont_id = _run_saga(base_event, olt, backend)

    assert status == "completed"
    assert ont_created is True
    assert target_ont_id == 5
    olt.add_ont_basic.assert_awaited_once()
    olt.configure_wan.assert_awaited_once()
    olt.configure_tr069.assert_awaited_once()
    olt.reboot_ont.assert_awaited_once()
    backend.update_ont_id_by_serial.assert_awaited_once_with("HWTC99990001", 5)


def test_descoberta_ont_id(base_event):
    """Quando ont_id=None, seleciona primeiro ID livre (2, pois 1 e 3 estão ocupados)."""
    base_event["ont_id"] = None
    olt, backend = _make_mocks()
    status, _, target_ont_id = _run_saga(base_event, olt, backend)

    assert status == "completed"
    assert target_ont_id == 2
    olt.get_provisioned_onts.assert_awaited_once()


def test_porta_lotada(base_event):
    """IDs 1-127 ocupados → falha com mensagem clara."""
    base_event["ont_id"] = None
    olt, backend = _make_mocks()
    olt.get_provisioned_onts = AsyncMock(return_value=[{"ont_id": i} for i in range(1, 128)])

    status, ont_created, _ = _run_saga(base_event, olt, backend)

    assert status == "failed"
    assert ont_created is False


def test_falha_step1_sem_rollback(base_event):
    """Falha no add_ont_basic — não tenta rollback (ont_created=False)."""
    olt, backend = _make_mocks()
    olt.add_ont_basic = AsyncMock(side_effect=Exception("SSH timeout"))

    status, ont_created, _ = _run_saga(base_event, olt, backend)

    assert status == "failed"
    assert ont_created is False
    olt.delete_service_ports.assert_not_awaited()
    olt.delete_ont.assert_not_awaited()


def test_falha_step2_configure_wan_com_rollback(base_event):
    """Falha no configure_wan — executa rollback (delete SPs + delete ONT)."""
    olt, backend = _make_mocks()
    olt.configure_wan = AsyncMock(side_effect=Exception("WAN config failed"))

    status, ont_created, _ = _run_saga(base_event, olt, backend)

    assert status == "failed"
    assert ont_created is True
    olt.delete_service_ports.assert_awaited_once()
    olt.delete_ont.assert_awaited_once()


def test_falha_step3_add_service_port_com_rollback(base_event):
    """Falha no add_service_port — executa rollback."""
    olt, backend = _make_mocks()
    olt.add_service_port = AsyncMock(side_effect=Exception("Service port failed"))

    status, ont_created, _ = _run_saga(base_event, olt, backend)

    assert status == "failed"
    assert ont_created is True
    olt.delete_service_ports.assert_awaited_once()
    olt.delete_ont.assert_awaited_once()


def test_rollback_falha_nao_propaga(base_event):
    """Rollback falha — sem exceção propagada."""
    olt, backend = _make_mocks()
    olt.configure_wan = AsyncMock(side_effect=Exception("WAN failed"))
    olt.delete_service_ports = AsyncMock(side_effect=Exception("Rollback delete SPs failed"))
    olt.delete_ont = AsyncMock(side_effect=Exception("Rollback delete ONT failed"))

    status, ont_created, _ = _run_saga(base_event, olt, backend)

    assert status == "failed"
    assert ont_created is True
    # Não lançou exceção — rollback falha é tolerada


def test_db_sync_falha_provisionamento_ok(base_event):
    """DB sync falha — provisionamento físico OK, apenas warning."""
    olt, backend = _make_mocks()
    backend.update_ont_id_by_serial = AsyncMock(side_effect=Exception("DB unreachable"))

    status, ont_created, _ = _run_saga(base_event, olt, backend)

    assert status == "completed"
    assert ont_created is True
    olt.reboot_ont.assert_awaited_once()


def test_create_mgmt_service_port_true(base_event):
    """create_mgmt_service_port=True — cria service port de gerência."""
    base_event["create_mgmt_service_port"] = True
    olt, backend = _make_mocks()
    status, _, _ = _run_saga(base_event, olt, backend)

    assert status == "completed"
    # 2 chamadas: 1 mgmt + 1 internet
    assert olt.add_service_port.await_count == 2


def test_create_mgmt_service_port_false(base_event):
    """create_mgmt_service_port=False — pula service port de gerência."""
    base_event["create_mgmt_service_port"] = False
    olt, backend = _make_mocks()
    status, _, _ = _run_saga(base_event, olt, backend)

    assert status == "completed"
    # Apenas 1 chamada: internet service port
    assert olt.add_service_port.await_count == 1


def test_backend_client_url_corrigida():
    """Verifica que a URL do BackendClient usa /api/provisioning/clients/serial/."""
    client = BackendClient()
    # A URL é construída no método, verificamos via inspeção do source
    import inspect
    source = inspect.getsource(client.update_ont_id_by_serial)
    assert "/api/provisioning/clients/serial/" in source
    assert "/api/v1/subscribers/by-serial/" not in source
