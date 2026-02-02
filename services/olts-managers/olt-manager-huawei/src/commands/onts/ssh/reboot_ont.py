from typing import Dict, Any
from ....core.logging import get_logger
from ....services.connection_manager import ConnectionManager

logger = get_logger(__name__)

class RebootOntCommand:
    def __init__(self, port: str, ont_id: int):
        self.port = port
        self.ont_id = ont_id

    def execute(self, connection: ConnectionManager, olt_version: str) -> Dict[str, Any]:
        parts = self.port.split('/')
        if len(parts) == 3:
            f, s, p = parts
            interface_cmd = f"interface gpon {f}/{s}"
            ont_port_idx = p
        else:
            raise ValueError(f"Formato de porta inválido: {self.port}")

        logger.info(f"Reiniciando ONU {self.ont_id} na porta {self.port}...")

        try:
            connection.send_command("config")
            connection.send_command(interface_cmd)
            
            # Usar timing para lidar com o dialogo y/n
            connection.send_command_timing(f"ont reset {ont_port_idx} {self.ont_id}")
            output = connection.send_command_timing("y")
            
            connection.send_command("return")

            return {"status": "success", "message": "Reboot command sent", "details": output}

        except Exception as e:
            try:
                connection.send_command("return")
            except:
                pass
            raise e
