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
        # Reutiliza o schema de evento pois tem os mesmos campos de rede
        event = ProvisioningEvent(**event_data)
        logger.info(f"Iniciando Saga de Reconfiguração WAN para SN {event.serial_number}")

        try:
            # PASSO 1: Configuração de WAN (Gerência)
            # Só executa se houver vlan_id ou mgmt_vlan no evento
            if event.vlan_id or event.mgmt_vlan:
                logger.info(f"Passo 1: Reconfigurando WAN de Gerência (VLAN {event.mgmt_vlan or 200})...")
                wan_data = {
                    "port": event.port,
                    "ont_id": event.ont_id,
                    "serial_number": event.serial_number,
                    "mgmt_vlan": event.mgmt_vlan or 200,
                    "ip_mode": event.wan_mode,
                    "ip_address": event.ip_address,
                    "mask": event.mask,
                    "gateway": event.gateway
                }
                await self.olt_client.configure_wan(event.olt_id, wan_data)
            else:
                logger.info("Pulando configuração de WAN (nenhum dado de rede enviado).")

            # PASSO 2: Configuração de TR-069
            if event.tr069_profile_id:
                logger.info("Passo 2: Reconfigurando TR-069...")
                tr069_data = {
                    "port": event.port,
                    "ont_id": event.ont_id,
                    "profile_id": event.tr069_profile_id
                }
                await self.olt_client.configure_tr069(event.olt_id, tr069_data)

            # PASSO 2b: Criar Service Port de Gerência (Obrigatório para IP)
            if event.mgmt_vlan:
                logger.info(f"Passo 2b: Criando Service Port de Gerência (VLAN {event.mgmt_vlan})...")
                mgmt_sp_data = {
                    "port": event.port,
                    "ont_id": event.ont_id,
                    "vlan": event.mgmt_vlan,
                    "user_vlan": event.mgmt_vlan,
                    "gemport": 2, # Padrão para gerência
                    "description": f"MGMT_{event.serial_number[-4:]}"
                }
                # A criação de service-port pode falhar se já existir, mas o driver trata isso
                await self.olt_client.add_service_port(event.olt_id, mgmt_sp_data)

            # PASSO FINAL: Reboot
            logger.info("Passo Final: Reiniciando ONU para aplicar alterações...")
            await self.olt_client.reboot_ont(event.olt_id, event.port, event.ont_id)

            # SUCESSO FINAL
            self._update_status(event.task_id, "completed", "Reconfiguração concluída com sucesso")
            logger.info(f"Reconfiguração concluída para {event.serial_number}")

        except Exception as e:
            logger.error(f"FALHA NA RECONFIGURAÇÃO para {event.serial_number}: {str(e)}")
            self._update_status(event.task_id, "failed", f"Falha na reconfiguração: {str(e)}")

    def _update_status(self, task_id: str, status: str, message: str):
        result = {
            "task_id": task_id,
            "status": status,
            "message": message
        }
        self.redis.lpush("task_results", json.dumps(result))
