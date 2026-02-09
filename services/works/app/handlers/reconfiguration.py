import logging
from ..schemas.events import ProvisioningEvent
from ..services.olt_client import OLTClient
import json

logger = logging.getLogger(__name__)

class ReconfigurationHandler:
    def __init__(self, redis_client):
        self.olt_client = OLTClient()
        self.redis = redis_client

    async def handle(self, event_data: dict):
        event = ProvisioningEvent(**event_data)
        logger.info(f"Iniciando Saga de Ativação TR-069 para SN {event.serial_number}")

        try:
            # PASSO 1: Configuração de TR-069
            if event.tr069_profile_id:
                logger.info(f"Passo 1: Vinculando ONU {event.ont_id} ao perfil TR-069 ID {event.tr069_profile_id}...")
                tr069_data = {
                    "port": event.port,
                    "ont_id": event.ont_id,
                    "profile_id": event.tr069_profile_id
                }
                await self.olt_client.configure_tr069(event.olt_id, tr069_data)

            # PASSO 2: Criar Service Port de Gerência (Apenas se a flag estiver ON)
            if event.mgmt_vlan and event.create_mgmt_service_port:
                logger.info(f"Passo 2: Criando Service Port de Gerência (VLAN {event.mgmt_vlan})...")
                mgmt_sp_data = {
                    "port": event.port,
                    "ont_id": event.ont_id,
                    "vlan": event.mgmt_vlan,
                    "user_vlan": event.mgmt_vlan,
                    "gemport": 2, 
                    "description": f"MGMT_{event.serial_number[-4:]}"
                }
                await self.olt_client.add_service_port(event.olt_id, mgmt_sp_data)
            else:
                logger.info("Passo 2: Pulando criação de Service Port de Gerência.")

            # PASSO FINAL: SUCESSO (Sem reboot forçado para ser transparente)
            self._update_status(event.task_id, "completed", "Configuração TR-069 aplicada com sucesso.")
            logger.info(f"Ativação TR-069 concluída para {event.serial_number}")

        except Exception as e:
            logger.error(f"FALHA NA ATIVAÇÃO TR-069 para {event.serial_number}: {str(e)}")
            self._update_status(event.task_id, "failed", f"Falha na configuração: {str(e)}")

    def _update_status(self, task_id: str, status: str, message: str):
        result = {
            "task_id": task_id,
            "status": status,
            "message": message
        }
        self.redis.lpush("task_results", json.dumps(result))