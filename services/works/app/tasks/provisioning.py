import logging
import httpx
import json
from celery import Task
from celery_app import celery_app
from functools import wraps

logger = logging.getLogger(__name__)


def get_redis():
    import redis
    import os
    return redis.Redis(
        host=os.getenv("REDIS_HOST", "redis"),
        password=os.getenv("REDIS_PASSWORD", "password"),
        decode_responses=True
    )


class OLTClient:
    def __init__(self):
        import os
        self.base_url = os.getenv("OLT_MANAGER_HUAWEI_URL", "http://olt-manager-huawei:8001")

    async def add_ont_basic(self, olt_id: int, data: dict):
        url = f"{self.base_url}/api/v1/olts/{olt_id}/onts/simple"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, timeout=30.0)
            response.raise_for_status()
            return response.json()

    async def get_provisioned_onts(self, olt_id: int, port: str):
        p = port.split('/')
        url = f"{self.base_url}/api/v1/olts/{olt_id}/ports/{p[0]}/{p[1]}/{p[2]}/onts/all"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=20.0)
            response.raise_for_status()
            return response.json()

    async def configure_wan(self, olt_id: int, data: dict):
        url = f"{self.base_url}/api/v1/olts/{olt_id}/onts/wan-config-only"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, timeout=30.0)
            response.raise_for_status()
            return response.json()

    async def configure_tr069(self, olt_id: int, data: dict):
        url = f"{self.base_url}/api/v1/olts/{olt_id}/onts/tr069-config-only"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, timeout=30.0)
            response.raise_for_status()
            return response.json()

    async def add_service_port(self, olt_id: int, data: dict):
        url = f"{self.base_url}/api/v1/olts/{olt_id}/service-ports/atomic"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, params=data, timeout=30.0)
            response.raise_for_status()
            return response.json()

    async def delete_service_ports(self, olt_id: int, port: str, ont_id: int):
        url = f"{self.base_url}/api/v1/olts/{olt_id}/service-ports/atomic"
        params = {"port": port, "ont_id": ont_id}
        async with httpx.AsyncClient() as client:
            response = await client.delete(url, params=params, timeout=30.0)
            return response.json()

    async def reboot_ont(self, olt_id: int, port: str, ont_id: int):
        p = port.split('/')
        url = f"{self.base_url}/api/v1/olts/{olt_id}/ports/{p[0]}/{p[1]}/{p[2]}/onts/{ont_id}/reboot"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, timeout=30.0)
            return response.json()

    async def delete_ont(self, olt_id: int, port: str, ont_id: int):
        p = port.split('/')
        url = f"{self.base_url}/api/v1/olts/{olt_id}/ports/{p[0]}/{p[1]}/{p[2]}/onts/{ont_id}"
        async with httpx.AsyncClient() as client:
            response = await client.delete(url, timeout=30.0)
            return response.json()


class BackendClient:
    def __init__(self):
        import os
        self.base_url = os.getenv("BACKEND_API_URL", "http://backend:8000")

    async def update_ont_id_by_serial(self, serial_number: str, ont_id: int):
        url = f"{self.base_url}/api/provisioning/clients/serial/{serial_number}"
        async with httpx.AsyncClient() as client:
            response = await client.put(url, json={"ont_id": ont_id}, timeout=20.0)
            response.raise_for_status()
            return response.json()


def update_status(task_id: str, status: str, message: str, step_current: int = 0, step_total: int = 8, step_name: str = ""):
    redis_client = get_redis()
    data = {
        "task_id": task_id,
        "status": status,
        "message": message,
        "step_current": step_current,
        "step_total": step_total,
        "step_name": step_name,
    }
    key = f"task:{task_id}"
    redis_client.hset(key, mapping=data)
    redis_client.expire(key, 86400)


@celery_app.task(bind=True, name="app.tasks.provisioning.provision_ont", max_retries=3, default_retry_delay=60)
def provision_ont(self: Task, event_data: dict):
    import asyncio
    event = event_data
    logger.info(f"[Celery] Iniciando provisionamento para SN {event.get('serial_number')}")
    
    olt_client = OLTClient()
    backend_client = BackendClient()
    redis_client = get_redis()
    
    ont_created = False
    target_ont_id = event.get("ont_id")

    async def run_provisioning():
        nonlocal ont_created, target_ont_id

        update_status(event["task_id"], "running", "Iniciando provisionamento", step_current=0, step_name="init")

        if not target_ont_id or target_ont_id <= 0:
            logger.info(f"[Celery] Descobrindo ID livre na porta {event.get('port')}...")
            provisioned = await olt_client.get_provisioned_onts(event["olt_id"], event["port"])
            used_ids = {int(ont['ont_id']) for ont in provisioned if 'ont_id' in ont}
            
            for candidate in range(1, 128):
                if candidate not in used_ids:
                    target_ont_id = candidate
                    break
            
            if not target_ont_id:
                raise Exception(f"Não há IDs disponíveis na porta {event.get('port')}")
            
            logger.info(f"[Celery] ID {target_ont_id} selecionado")

        update_status(event["task_id"], "running", "Registrando ONT na OLT", step_current=1, step_name="add_ont_basic")
        basic_data = {
            "port": event["port"],
            "ont_id": target_ont_id,
            "serial_number": event["serial_number"],
            "line_profile": event.get("line_profile"),
            "srv_profile": event.get("srv_profile"),
            "description": event.get("description")
        }
        await olt_client.add_ont_basic(event["olt_id"], basic_data)
        ont_created = True

        update_status(event["task_id"], "running", "Configurando WAN", step_current=2, step_name="configure_wan")
        if event.get("mgmt_vlan"):
            wan_data = {
                "port": event["port"],
                "ont_id": target_ont_id,
                "serial_number": event["serial_number"],
                "mgmt_vlan": event["mgmt_vlan"],
                "ip_mode": event.get("wan_mode"),
                "ip_address": event.get("ip_address"),
                "mask": event.get("mask"),
                "gateway": event.get("gateway")
            }
            await olt_client.configure_wan(event["olt_id"], wan_data)

        update_status(event["task_id"], "running", "Configurando TR-069", step_current=3, step_name="configure_tr069")
        if event.get("tr069_profile_id"):
            tr069_data = {
                "port": event["port"],
                "ont_id": target_ont_id,
                "profile_id": event["tr069_profile_id"]
            }
            await olt_client.configure_tr069(event["olt_id"], tr069_data)

        update_status(event["task_id"], "running", "Criando service port de gerência", step_current=4, step_name="mgmt_service_port")
        if event.get("mgmt_vlan") and event.get("create_mgmt_service_port"):
            mgmt_sp_data = {
                "port": event["port"],
                "ont_id": target_ont_id,
                "vlan": event["mgmt_vlan"],
                "user_vlan": event["mgmt_vlan"],
                "gemport": 2,
                "description": f"MGMT_{event['serial_number'][-4:]}"
            }
            await olt_client.add_service_port(event["olt_id"], mgmt_sp_data)

        update_status(event["task_id"], "running", "Criando service port de internet", step_current=5, step_name="internet_service_port")
        if event.get("vlan_id"):
            service_port_data = {
                "port": event["port"],
                "ont_id": target_ont_id,
                "vlan": event["mgmt_vlan"],
                "user_vlan": event["vlan_id"],
                "gemport": 1,
                "description": f"INTERNET_{event['serial_number'][-4:]}"
            }
            await olt_client.add_service_port(event["olt_id"], service_port_data)

        update_status(event["task_id"], "running", "Reiniciando ONT", step_current=6, step_name="reboot_ont")
        await olt_client.reboot_ont(event["olt_id"], event["port"], target_ont_id)

        update_status(event["task_id"], "running", "Sincronizando banco de dados", step_current=7, step_name="db_sync")
        try:
            await backend_client.update_ont_id_by_serial(event["serial_number"], target_ont_id)
        except Exception as db_err:
            logger.warning(f"[Celery] Provisionamento físico OK, falha DB: {db_err}")

        update_status(event["task_id"], "completed", f"Provisionamento concluído (ID: {target_ont_id})", step_current=8, step_name="done")
        logger.info(f"[Celery] SUCESSO para {event.get('serial_number')}")

    async def run_rollback():
        logger.warning(f"[Celery] Executando rollback para ONT {target_ont_id}")
        try:
            await olt_client.delete_service_ports(event["olt_id"], event["port"], target_ont_id)
            await olt_client.delete_ont(event["olt_id"], event["port"], target_ont_id)
            logger.info("[Celery] Rollback realizado com sucesso")
        except Exception as rollback_err:
            logger.critical(f"[Celery] ERRO no rollback: {rollback_err}")

    try:
        asyncio.run(run_provisioning())
    except Exception as e:
        logger.error(f"[Celery] FALHA no provisionamento: {str(e)}")
        if ont_created:
            asyncio.run(run_rollback())
        update_status(event["task_id"], "failed", f"Falha: {str(e)}", step_name="error")
        
        try:
            raise self.retry(exc=e)
        except self.MaxRetriesExceededError:
            logger.error(f"[Celery] Máximo de retries excedido para {event.get('serial_number')}")
            raise


@celery_app.task(name="app.tasks.provisioning.trigger_provisioning")
def trigger_provisioning(event_data: dict):
    return provision_ont.delay(event_data)
