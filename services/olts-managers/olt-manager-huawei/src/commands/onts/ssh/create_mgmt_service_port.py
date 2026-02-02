from typing import Dict, Any
from ....core.logging import get_logger
from ....services.connection_manager import ConnectionManager

logger = get_logger(__name__)

class CreateMgmtServicePortCommand:
    def __init__(self, port: str, ont_id: int, vlan: int = 200, gemport: int = 2):
        self.port = port
        self.ont_id = ont_id
        self.vlan = vlan
        self.gemport = gemport

    def execute(self, connection: ConnectionManager, olt_version: str) -> Dict[str, Any]:
        """
        Cria a service-port de gerência para a ONU.
        IMPORTANTE: Este comando deve ser executado no modo CONFIG raiz.
        """
        logger.info(f"Criando service-port de gerência na ONU {self.ont_id} (Porta {self.port}, VLAN {self.vlan})...")

        try:
            # Garante que estamos no modo config e NÃO dentro de interface
            connection.send_command("config")
            
            # Comando sem ID (atribuição automática pela OLT)
            cmd = (
                f"service-port vlan {self.vlan} gpon {self.port} ont {self.ont_id} "
                f"gemport {self.gemport} multi-service user-vlan {self.vlan} tag-transform translate"
            )
            
            output = connection.send_command(cmd)
            
            # Se a OLT aceitou mas deu algum aviso, limpamos para garantir o prompt
            if "already exists" in output.lower():
                logger.info("Service-port de gerência já existe.")
                return {"status": "success", "message": "Already exists"}

            if "Failure" in output or "Error" in output:
                logger.error(f"Falha ao criar service-port: {output}")
                return {"status": "error", "message": output}

            logger.info("Service-port criada com sucesso.")
            return {"status": "success", "message": "Created", "details": output}

        except Exception as e:
            logger.error(f"Erro na execução da service-port: {e}")
            raise e