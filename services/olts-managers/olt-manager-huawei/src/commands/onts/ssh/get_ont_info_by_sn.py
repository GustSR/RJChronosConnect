import re
from typing import Dict, Any, List
from ....services.connection_manager import ConnectionManager
from ....core.logging import get_logger

logger = get_logger(__name__)

class GetOntInfoBySnCliCommand:
    def __init__(self, serial_number: str):
        self.serial_number = serial_number

    def execute(self, connection: ConnectionManager, olt_version: str) -> List[Dict[str, Any]]:
        """
        Busca informações da ONT pelo Serial Number via CLI.
        Comando: display ont info by-sn <SN>
        """
        cmd = f"display ont info by-sn {self.serial_number}"
        output = connection.send_command(cmd)
        
        results = []
        
        # Regex para capturar F/S/P e ONT ID
        # Exemplo de saida:
        # -----------------------------------------------------------------------------
        # F/S/P   ONT-ID   Description
        # 0/5/2   28       Cliente...
        # -----------------------------------------------------------------------------
        
        # Procura por linhas que começam com numeros (F/S/P)
        lines = output.splitlines()
        for line in lines:
            if re.match(r'\s*\d+/\d+/\d+', line):
                parts = line.split()
                if len(parts) >= 2:
                    fsp = parts[0] # 0/5/2
                    ont_id = parts[1] # 28
                    
                    # Parse F/S/P
                    f, s, p = fsp.split('/')
                    
                    results.append({
                        "ont_id": int(ont_id),
                        "frame": int(f),
                        "slot": int(s),
                        "port": int(p), # Pon port
                        "fsp": fsp,
                        "serial_number": self.serial_number
                    })
        
        return results
