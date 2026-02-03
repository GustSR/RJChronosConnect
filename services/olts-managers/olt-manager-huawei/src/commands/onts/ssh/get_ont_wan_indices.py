import re
from typing import List
from ....services.connection_manager import ConnectionManager
from ....core.logging import get_logger

logger = get_logger(__name__)

class GetOntWanIndicesCommand:
    def __init__(self, port: str, ont_id: int):
        self.port = port
        self.ont_id = ont_id

    def execute(self, connection: ConnectionManager, olt_version: str) -> List[int]:
        parts = self.port.split('/')
        if len(parts) == 3:
            f, s, p = parts
            ont_port_idx = p
        else:
            ont_port_idx = "0"

        # Rodar o comando e capturar tudo
        cmd = f"display ont wan-info {ont_port_idx} {self.ont_id}"
        # Usa send_command_safe para evitar problemas de regex no prompt
        output = connection.send_command_safe(cmd, timeout=15.0)

        # Procura por "Index : X" usando Regex
        indices = re.findall(r'Index\s*:\s*(\d+)', output, re.IGNORECASE)
        
        result = sorted(list(set([int(i) for i in indices])))
        logger.info(f"Índices detectados na ONU {self.ont_id}: {result}")
        return result