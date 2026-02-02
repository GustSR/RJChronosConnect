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
        """
        sn = self.serial_number.strip()
        cmd = f"display ont info by-sn {sn}"
        
        # Aumentar o timeout e garantir que lemos tudo
        output = connection.send_command(cmd, read_timeout=20)
        
        results = []
        fsp = None
        ont_id = None
        
        # Regex flexível para capturar F/S/P e ONT-ID em qualquer lugar da linha
        for line in output.splitlines():
            # Busca F/S/P (ex: 0/5/2)
            fsp_match = re.search(r'F/S/P\s*:\s*(\d+/\d+/\d+)', line, re.IGNORECASE)
            if fsp_match:
                fsp = fsp_match.group(1)
            
            # Busca ONT-ID (ex: 28)
            id_match = re.search(r'ONT-ID\s*:\s*(\d+)', line, re.IGNORECASE)
            if id_match:
                ont_id = id_match.group(1)

        if fsp and ont_id:
            try:
                f, s, p = fsp.split('/')
                results.append({
                    "ont_id": int(ont_id),
                    "frame": int(f),
                    "slot": int(s),
                    "port": int(p),
                    "fsp": fsp,
                    "serial_number": sn
                })
                return results
            except Exception:
                pass
        
        # Fallback para formato tabular
        match = re.search(r'(\d+/\d+/\d+)\s+(\d+)', output)
        if match:
            fsp_val = match.group(1)
            id_val = match.group(2)
            f, s, p = fsp_val.split('/')
            results.append({
                "ont_id": int(id_val),
                "frame": int(f),
                "slot": int(s),
                "port": int(p),
                "fsp": fsp_val,
                "serial_number": sn
            })

        return results