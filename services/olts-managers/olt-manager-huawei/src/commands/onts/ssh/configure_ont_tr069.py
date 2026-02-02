from typing import Dict, Any
from ....core.logging import get_logger
from ....services.connection_manager import HuaweiTelnetDriver

logger = get_logger(__name__)

class ConfigureOntTr069Command:
    def __init__(self, port: str, ont_id: int, profile_id: int):
        self.port = port
        self.ont_id = ont_id
        self.profile_id = profile_id

    def execute(self, connection: HuaweiTelnetDriver, olt_version: str) -> Dict[str, Any]:
        """
        Vincula a ONU a um perfil de servidor TR-069.
        Comando: ont tr069-server-config <port> <ont_id> profile-id <id>
        """
        parts = self.port.split('/')
        if len(parts) == 3:
            frame, slot, port_idx = parts
            interface_cmd = f"interface gpon {frame}/{slot}"
            ont_port_idx = port_idx
        else:
             # Tentar lidar com caso onde port já é só o índice, mas precisamos do contexto da interface
             # Assumindo que quem chamou já setou o contexto ou que o formato é full path
             raise ValueError(f"Formato de porta inválido para TR069 config: {self.port}")

        logger.info(f"Vinculando ONU {self.ont_id} ao perfil TR-069 ID {self.profile_id}...")

        connection.send_command("config")
        connection.send_command(interface_cmd)

        cmd = f"ont tr069-server-config {ont_port_idx} {self.ont_id} profile-id {self.profile_id}"
        output = connection.send_command(cmd)
        
        connection.send_command("quit")

        if "Failure" in output or "Error" in output:
             logger.error(f"Falha ao configurar TR-069 Profile: {output}")
             return {"status": "error", "message": output}

        logger.info("Perfil TR-069 vinculado com sucesso.")
        return {"status": "success", "message": "TR-069 configured", "details": output}
