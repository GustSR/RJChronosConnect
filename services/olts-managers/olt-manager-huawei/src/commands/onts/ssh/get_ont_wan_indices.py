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
        """
        Busca os índices de WAN já utilizados na ONT.
        """
        # Parse da porta para entrar na interface
        parts = self.port.split('/')
        if len(parts) == 3:
            f, s, p = parts
            interface_cmd = f"interface gpon {f}/{s}"
            ont_port_idx = p
        else:
            raise ValueError(f"Formato de porta inválido: {self.port}")

        # O comando display ont wan-info pode ser rodado dentro ou fora da interface
        # Vamos rodar dentro para garantir contexto em algumas versoes
        connection.send_command("config")
        connection.send_command(interface_cmd)
        
        cmd = f"display ont wan-info {ont_port_idx} {self.ont_id}"
        output = connection.send_command(cmd)
        connection.send_command("return")

        # Procura por "Index : X" na saída
        # Exemplo: Index                      : 1
        indices = []
        for line in output.splitlines():
            if "Index" in line and ":" in line:
                try:
                    val = line.split(":")[1].strip()
                    indices.append(int(val))
                except (ValueError, IndexError):
                    continue
        
        logger.info(f"Índices de WAN em uso na ONU {self.ont_id}: {indices}")
        return sorted(list(set(indices)))
