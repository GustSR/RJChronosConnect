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
        Comando: service-port vlan <vlan> gpon <port> ont <ont_id> gemport <gem> multi-service user-vlan <vlan> tag-transform translate
        """
        logger.info(f"Criando service-port de gerência na ONU {self.ont_id} (Porta {self.port}, VLAN {self.vlan}, Gemport {self.gemport})...")

        try:
            connection.send_command("config")
            
            # Comando completo para gerência
            cmd = (
                f"service-port vlan {self.vlan} gpon {self.port} ont {self.ont_id} "
                f"gemport {self.gemport} multi-service user-vlan {self.vlan} tag-transform translate"
            )
            
            output = connection.send_command(cmd)
            
            connection.send_command("return")

            if "Failure" in output or "Error" in output:
                # Verifica se o erro é apenas que já existe
                if "already exists" in output.lower() or "The service port already exists" in output:
                    logger.info("Service-port de gerência já existe na OLT.")
                    return {"status": "success", "message": "Service-port already exists"}
                
                logger.error(f"Falha ao criar service-port de gerência: {output}")
                return {"status": "error", "message": output}

            logger.info("Service-port de gerência criada com sucesso.")
            return {"status": "success", "message": "Service-port created", "details": output}

        except Exception as e:
            try:
                connection.send_command("return")
            except:
                pass
            raise e
