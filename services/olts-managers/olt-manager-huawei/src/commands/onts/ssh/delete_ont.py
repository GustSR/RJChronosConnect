from typing import Dict, Any
from ....core.logging import get_logger
from ....services.connection_manager import ConnectionManager

logger = get_logger(__name__)

class DeleteOntCommand:
    """Command to remove an ONT from a PON via CLI."""

    def __init__(self, port: str, ont_id: int):
        self.port = port
        self.ont_id = ont_id

    def execute(self, connection: ConnectionManager, olt_version: str) -> Dict[str, Any]:
        parts = self.port.split('/')
        if len(parts) == 3:
            frame, slot, port_idx = parts
            interface_cmd = f"interface gpon {frame}/{slot}"
        else:
            raise ValueError(f"Formato de porta inválido: {self.port}")

        logger.info(f"Deletando ONU {self.ont_id} na porta {self.port}...")

        try:
            # Limpa o buffer antes de começar
            if hasattr(connection.connection, 'clear_buffer'):
                connection.connection.clear_buffer()

            connection.send_command("config")
            connection.send_command(interface_cmd)
            
            # Espaços explícitos para evitar comandos 'grudados'
            cmd = f"ont delete {port_idx} {self.ont_id}"
            output = connection.send_command(cmd)
            
            connection.send_command("return")

            if "Failure" in output or "Error" in output:
                logger.error(f"Falha ao deletar ONU: {output}")
                return {"status": "error", "message": output}

            logger.info("ONU deletada com sucesso.")
            return {"status": "success", "message": "ONU deleted", "details": output}

        except Exception as e:
            try:
                connection.send_command("return")
            except:
                pass
            raise e
