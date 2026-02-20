import logging
import httpx
import asyncio
from celery import Task
from celery_app import celery_app

logger = logging.getLogger(__name__)


class OLTClient:
    def __init__(self):
        import os
        self.base_url = os.getenv("OLT_MANAGER_HUAWEI_URL", "http://olt-manager-huawei:8001")

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


def update_status(task_id: str, status: str, message: str):
    import json
    import redis
    import os
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "redis"),
        password=os.getenv("REDIS_PASSWORD", "password"),
        decode_responses=True
    )
    result = {
        "task_id": task_id,
        "status": status,
        "message": message
    }
    redis_client.lpush("task_results", json.dumps(result))


@celery_app.task(bind=True, name="app.tasks.reconfiguration.reconfigure_tr069", max_retries=3, default_retry_delay=60)
def reconfigure_tr069(self: Task, event_data: dict):
    logger.info(f"[Celery] Iniciando reconfiguração TR-069 para SN {event_data.get('serial_number')}")
    
    olt_client = OLTClient()
    
    async def run_reconfiguration():
        if event_data.get("tr069_profile_id"):
            tr069_data = {
                "port": event_data["port"],
                "ont_id": event_data["ont_id"],
                "profile_id": event_data["tr069_profile_id"]
            }
            await olt_client.configure_tr069(event_data["olt_id"], tr069_data)

        if event_data.get("mgmt_vlan") and event_data.get("create_mgmt_service_port"):
            mgmt_sp_data = {
                "port": event_data["port"],
                "ont_id": event_data["ont_id"],
                "vlan": event_data["mgmt_vlan"],
                "user_vlan": event_data["mgmt_vlan"],
                "gemport": 2,
                "description": f"MGMT_{event_data['serial_number'][-4:]}"
            }
            await olt_client.add_service_port(event_data["olt_id"], mgmt_sp_data)

        update_status(event_data["task_id"], "completed", "Configuração TR-069 aplicada com sucesso.")
        logger.info(f"[Celery] Reconfiguração TR-069 concluída para {event_data.get('serial_number')}")

    try:
        asyncio.run(run_reconfiguration())
    except Exception as e:
        logger.error(f"[Celery] FALHA na reconfiguração TR-069: {str(e)}")
        update_status(event_data["task_id"], "failed", f"Falha: {str(e)}")
        
        try:
            raise self.retry(exc=e)
        except self.MaxRetriesExceededError:
            logger.error(f"[Celery] Máximo de retries excedido para {event_data.get('serial_number')}")
            raise


@celery_app.task(name="app.tasks.reconfiguration.trigger_reconfiguration")
def trigger_reconfiguration(event_data: dict):
    return reconfigure_tr069.delay(event_data)
