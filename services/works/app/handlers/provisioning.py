import logging
from ..schemas.events import ProvisioningEvent
from ..services.olt_client import OLTClient
import json

logger = logging.getLogger(__name__)

class ProvisioningHandler:
    def __init__(self, redis_client):
        self.olt_client = OLTClient()
        self.redis = redis_client

    async def handle(self, event_data: dict):
        event = ProvisioningEvent(**event_data)
        logger.info(f"Iniciando Saga de Provisionamento para SN {event.serial_number}")
        
        ont_created = False

        try:
            # PASSO 1: Configuração Básica
            logger.info("Passo 1: Criando ONT na OLT...")
            basic_data = {
                "port": event.port,
                "ont_id": event.ont_id,
                "serial_number": event.serial_number,
                "line_profile": event.line_profile,
                "srv_profile": event.srv_profile,
                "description": event.description
            }
            await self.olt_client.add_ont_basic(event.olt_id, basic_data)
            ont_created = True

            # PASSO 2: Configuração de WAN
            if event.vlan_id:
                logger.info("Passo 2a: Configurando WAN...")
                wan_data = {
                    "port": event.port,
                    "ont_id": event.ont_id,
                    "serial_number": event.serial_number,
                    "mgmt_vlan": event.vlan_id,
                    "ip_mode": event.wan_mode,
                    "ip_address": event.ip_address,
                    "mask": event.mask,
                    "gateway": event.gateway
                }
                await self.olt_client.configure_wan(event.olt_id, wan_data)

            # PASSO 2b: Configuração de TR-069
            if event.tr069_profile_id:
                logger.info("Passo 2b: Configurando TR-069...")
                tr069_data = {
                    "port": event.port,
                    "ont_id": event.ont_id,
                    "profile_id": event.tr069_profile_id
                }
                await self.olt_client.configure_tr069(event.olt_id, tr069_data)

            # PASSO 3: Reboot final
            logger.info("Passo 3: Reiniciando ONU para aplicar alterações...")
            await self.olt_client.reboot_ont(event.olt_id, event.port, event.ont_id)

            # SUCESSO FINAL
            self._update_status(event.task_id, "completed", "Provisionamento concluído com sucesso")
            logger.info(f"Saga concluída com SUCESSO para {event.serial_number}")

        except Exception as e:
            logger.error(f"FALHA NA SAGA para {event.serial_number}: {str(e)}")
            
            # COMPENSAÇÃO: Se a ONT foi criada mas o resto falhou, vamos removê-la
            if ont_created:
                logger.warning(f"Executando COMPENSAÇÃO (Rollback): Removendo ONT {event.ont_id} na porta {event.port}")
                try:
                    await self.olt_client.delete_ont(event.olt_id, event.port, event.ont_id)
                    logger.info("Compensação realizada: ONT removida.")
                except Exception as rollback_err:
                    logger.critical(f"ERRO CRÍTICO NA COMPENSAÇÃO: {rollback_err}")

            self._update_status(event.task_id, "failed", f"Falha no provisionamento: {str(e)}")

    def _update_status(self, task_id: str, status: str, message: str):
        result = {
            "task_id": task_id,
            "status": status,
            "message": message
        }
        self.redis.lpush("task_results", json.dumps(result))
