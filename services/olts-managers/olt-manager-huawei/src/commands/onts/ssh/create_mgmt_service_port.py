import re
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

    def _resolve_service_port_id(self, connection: ConnectionManager) -> Optional[int]:
        if self.service_port_id:
            return self.service_port_id
        try:
            output = connection.send_command("display service-port all")
        except Exception as exc:
            logger.warning(f"Falha ao listar service-ports existentes: {exc}")
            return None

        ids = []
        for match in re.finditer(r'^\s*(\d+)\s', output, flags=re.MULTILINE):
            try:
                ids.append(int(match.group(1)))
            except (TypeError, ValueError):
                continue

        if not ids:
            return 1

        return max(ids) + 1

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

            service_port_id = self._resolve_service_port_id(connection)

            # Comando com ID (quando disponível), mantendo fallback para auto-atribuição
            id_prefix = f"service-port {service_port_id} " if service_port_id else "service-port "
            cmd = (
                f"{id_prefix}vlan {self.vlan} gpon {self.port} ont {self.ont_id} "
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
