import logging
import os
from celery import Celery

logger = logging.getLogger(__name__)

CELERY_BROKER_URL = os.getenv(
    "CELERY_BROKER_URL",
    f"amqp://{os.getenv('RABBITMQ_DEFAULT_USER', 'user')}:{os.getenv('RABBITMQ_DEFAULT_PASS', 'password')}@{os.getenv('RABBITMQ_HOST', 'rabbitmq')}:5672//"
)

celery_app = Celery("rjchronos_backend", broker=CELERY_BROKER_URL, backend=CELERY_BROKER_URL)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task(name="app.tasks.provisioning.provision_ont")
def provision_ont(event_data: dict):
    """Stub task - a tarefa real é executada no worker works"""
    logger.info(f"Task stub: provision_ont recebido para {event_data.get('serial_number')}")
    return {"status": "delegated", "task": "provision_ont", "data": event_data}


@celery_app.task(name="app.tasks.reconfiguration.reconfigure_tr069")
def reconfigure_tr069(event_data: dict):
    """Stub task - a tarefa real é executada no worker works"""
    logger.info(f"Task stub: reconfigure_tr069 recebido para {event_data.get('serial_number')}")
    return {"status": "delegated", "task": "reconfigure_tr069", "data": event_data}


def send_provisioning_task(event_data: dict):
    logger.info(f"Enviando tarefa de provisionamento para SN {event_data.get('serial_number')}")
    result = provision_ont.delay(event_data)
    return result.id


def send_reconfiguration_task(event_data: dict):
    logger.info(f"Enviando tarefa de reconfiguração para SN {event_data.get('serial_number')}")
    result = reconfigure_tr069.delay(event_data)
    return result.id


def get_task_status(task_id: str):
    from celery.result import AsyncResult
    
    async_result = AsyncResult(task_id)
    return {
        "task_id": task_id,
        "state": async_result.state,
        "result": async_result.result if async_result.ready() else None,
        "ready": async_result.ready(),
        "successful": async_result.successful() if async_result.ready() else None
    }
