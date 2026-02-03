from typing import Dict, Any, Optional
from ....core.logging import get_logger
from ....services.connection_manager import ConnectionManager

logger = get_logger(__name__)

class CreateMgmtServicePortCommand:
    def __init__(
        self,
        port: str,
        ont_id: int,
        vlan: int = 200,
        gemport: int = 2,
        service_port_id: Optional[int] = None,
    ):
        self.port = port
        self.ont_id = ont_id
        self.vlan = vlan
        self.gemport = gemport
        self.service_port_id = service_port_id

    def execute(self, connection: ConnectionManager, olt_version: str) -> Dict[str, Any]:
        """
        Cria a service-port de gerência para a ONU.
        
        Usa send_command_safe que lida automaticamente com prompts interativos.
        """
        logger.info(
            f"Criando service-port de gerência na ONU {self.ont_id} "
            f"(Porta {self.port}, VLAN {self.vlan})..."
        )

        try:
            # Usa send_command_safe para cada comando
            connection.send_command_safe("config")
            
            # Monta o comando service-port
            if self.service_port_id:
                cmd = f"service-port {self.service_port_id} vlan {self.vlan} gpon {self.port} ont {self.ont_id} gemport {self.gemport} multi-service user-vlan {self.vlan} tag-transform translate"
            else:
                cmd = f"service-port vlan {self.vlan} gpon {self.port} ont {self.ont_id} gemport {self.gemport} multi-service user-vlan {self.vlan} tag-transform translate"
            
            # send_command_safe detecta { <cr> } e envia ENTER automaticamente
            output = connection.send_command_safe(cmd)
            
            output_lower = output.lower()
            
            # Verifica se já existe
            if "already exists" in output_lower:
                logger.info("Service-port de gerência já existe.")
                return {"status": "success", "message": "Already exists"}

            # Verifica erros
            if any(marker in output_lower for marker in ("failure", "error", "unknown command", "too many parameters", "incomplete command")):
                logger.error(f"Falha ao criar service-port: {output}")
                return {"status": "error", "message": output}

            logger.info("Service-port criada com sucesso.")
            return {"status": "success", "message": "Created", "details": output}

        except Exception as e:
            logger.error(f"Erro na execução da service-port: {e}")
            raise e
