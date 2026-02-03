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
        IMPORTANTE: Este comando deve ser executado no modo CONFIG raiz.
        """
        logger.info(
            f"Criando service-port de gerência na ONU {self.ont_id} "
            f"(Porta {self.port}, VLAN {self.vlan})..."
        )

        try:
            # Garante que estamos no modo config e NÃO dentro de interface
            connection.send_command("config")
            tokens = ["service-port"]
            if self.service_port_id:
                tokens.append(str(self.service_port_id))
            tokens += [
                "vlan",
                str(self.vlan),
                "gpon",
                str(self.port),
                "ont",
                str(self.ont_id),
                "gemport",
                str(self.gemport),
                "multi-service",
                "user-vlan",
                str(self.vlan),
                "tag-transform",
                "translate",
            ]
            cmd = " ".join(tokens)
            
            output = connection.send_command(cmd)
            
            # Se a OLT aceitou mas deu algum aviso, limpamos para garantir o prompt
            output_lower = output.lower()
            if "already exists" in output_lower:
                logger.info("Service-port de gerência já existe.")
                return {"status": "success", "message": "Already exists"}

            if any(marker in output_lower for marker in ("failure", "error", "unknown command", "too many parameters", "incomplete command")):
                logger.error(f"Falha ao criar service-port: {output}")
                return {"status": "error", "message": output}

            logger.info("Service-port criada com sucesso.")
            return {"status": "success", "message": "Created", "details": output}

        except Exception as e:
            logger.error(f"Erro na execução da service-port: {e}")
            raise e
