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
        target_ont_id = event.ont_id

        try:
            # DESCOBERTA DE ID: Se não temos ID, vamos descobrir um livre
            if not target_ont_id or target_ont_id <= 0:
                logger.info(f"Descobrindo ID livre na porta {event.port}...")
                provisioned = await self.olt_client.get_provisioned_onts(event.olt_id, event.port)
                used_ids = {int(ont['ont_id']) for ont in provisioned if 'ont_id' in ont}
                
                # Procura o primeiro ID livre entre 1 e 127
                for candidate in range(1, 128):
                    if candidate not in used_ids:
                        target_ont_id = candidate
                        break
                
                if not target_ont_id:
                    raise Exception(f"Não há IDs disponíveis na porta {event.port}")
                
                logger.info(f"ID {target_ont_id} selecionado para o SN {event.serial_number}")

            # PASSO 1: Configuração Básica
            logger.info(f"Passo 1: Criando ONT {target_ont_id} na OLT...")
            basic_data = {
                "port": event.port,
                "ont_id": target_ont_id,
                "serial_number": event.serial_number,
                "line_profile": event.line_profile,
                "srv_profile": event.srv_profile,
                "description": event.description
            }
            await self.olt_client.add_ont_basic(event.olt_id, basic_data)
            ont_created = True

            # PASSO 2a: Configuração de WAN (Gerência)
            if event.mgmt_vlan:
                logger.info(f"Passo 2a: Configurando WAN de Gerência (VLAN {event.mgmt_vlan})...")
                wan_data = {
                    "port": event.port,
                    "ont_id": target_ont_id,
                    "serial_number": event.serial_number,
                    "mgmt_vlan": event.mgmt_vlan,
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
                    "ont_id": target_ont_id,
                    "profile_id": event.tr069_profile_id
                }
                await self.olt_client.configure_tr069(event.olt_id, tr069_data)

            # PASSO 3: Criar Service Port (Internet)
            if event.vlan_id:
                logger.info(f"Passo 3: Criando Service Port de Internet (Transporte S-VLAN: {event.mgmt_vlan}, Cliente C-VLAN: {event.vlan_id})...")
                service_port_data = {
                    "port": event.port,
                    "ont_id": target_ont_id,
                    "vlan": event.mgmt_vlan, # S-VLAN (Transporte, ex: 200)
                    "user_vlan": event.vlan_id, # C-VLAN (Cliente, ex: 106)
                    "gemport": 1, 
                    "description": f"INTERNET_{event.serial_number[-4:]}"
                }
                await self.olt_client.add_service_port(event.olt_id, service_port_data)

            # PASSO FINAL: Reboot
            logger.info("Passo Final: Reiniciando ONU para aplicar alterações...")
            await self.olt_client.reboot_ont(event.olt_id, event.port, target_ont_id)

            # SUCESSO FINAL
            self._update_status(event.task_id, "completed", f"Provisionamento concluído com sucesso (ID: {target_ont_id})")
            logger.info(f"Saga concluída com SUCESSO para {event.serial_number} no ID {target_ont_id}")

        except Exception as e:
            logger.error(f"FALHA NA SAGA para {event.serial_number}: {str(e)}")
            
            # COMPENSAÇÃO: Se a ONT foi criada mas o resto falhou, vamos removê-la
            if ont_created:
                logger.warning(f"Executando COMPENSAÇÃO (Rollback): Removendo ONT {target_ont_id} na porta {event.port}")
                try:
                    await self.olt_client.delete_ont(event.olt_id, event.port, target_ont_id)
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
