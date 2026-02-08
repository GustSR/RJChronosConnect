from typing import Dict, Any
import logging
from ....services.connection_manager import ConnectionManager

logger = logging.getLogger(__name__)

class UndoServicePortCommand:
    """Comando para remover service-ports de uma ONT específica na Huawei."""

    def __init__(self, port: str, ont_id: int):
        self.port = port
        self.ont_id = ont_id

    def execute(self, connection: ConnectionManager, olt_version: str) -> Dict[str, Any]:
        logger.info(f"Removendo service-ports da ONU {self.ont_id} na porta {self.port}...")

        try:
            # Garante modo global limpo
            connection.send_command_safe("return")
            connection.send_command_safe("config")
            
            # Comando global para apagar todas as service-ports daquela ONT
            cmd = f"undo service-port port {self.port} ont {self.ont_id}"
            output = connection.send_command_safe(cmd, timeout=15.0)
            
            connection.send_command_safe("return")

            return {
                "status": "success", 
                "message": "Service-ports removed", 
                "details": output
            }

        except Exception as e:
            logger.error(f"Erro ao remover service-ports: {e}")
            return {"status": "error", "message": str(e)}
