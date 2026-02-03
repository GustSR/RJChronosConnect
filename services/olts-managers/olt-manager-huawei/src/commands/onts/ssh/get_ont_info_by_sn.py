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
        candidates = [sn]
        if "-" in sn:
            candidates.append(sn.replace("-", ""))
        elif len(sn) >= 8:
            candidates.append(f"{sn[:4]}-{sn[4:]}")

        for candidate in candidates:
            cmd = f"display ont info by-sn {candidate}"
            # Usa send_command_safe para evitar problemas de regex no prompt
            output = connection.send_command_safe(cmd, timeout=20.0)
            results = []

            # 1. Tenta formato Verbose (mais preciso)
            fsp = None
            ont_id = None
            for line in output.splitlines():
                fsp_match = re.search(r'F/S/P\s*:\s*(\d+/\d+/\d+)', line, re.IGNORECASE)
                if fsp_match:
                    fsp = fsp_match.group(1)
                
                id_match = re.search(r'ONT-ID\s*:\s*(\d+)', line, re.IGNORECASE)
                if id_match:
                    ont_id = id_match.group(1)

            if fsp and ont_id and int(ont_id) > 0:
                try:
                    f, s, p = fsp.split('/')
                    return [{
                        "ont_id": int(ont_id),
                        "frame": int(f),
                        "slot": int(s),
                        "port": int(p),
                        "fsp": fsp,
                        "serial_number": candidate
                    }]
                except Exception:
                    pass
            
            # 2. Tenta formato Tabular (pegando todas as ONUs)
            # Regex busca F/S/P seguido de ID
            all_onts = re.findall(r'(\d+/\d+/\d+)\s+(\d+)', output)
            
            for fsp_val, id_val in all_onts:
                oid = int(id_val)
                if oid > 0: # Filtra ONUs reais (ID > 0)
                    try:
                        f, s, p = fsp_val.split('/')
                        results.append({
                            "ont_id": oid,
                            "frame": int(f),
                            "slot": int(s),
                            "port": int(p),
                            "fsp": fsp_val,
                            "serial_number": candidate
                        })
                    except Exception:
                        continue
            
            # Se encontrou ONUs reais, retorna a primeira
            if results:
                logger.info(
                    f"Parser encontrou {len(results)} ONUs reais para o SN {candidate}. "
                    f"Usando a primeira: {results[0]['fsp']}"
                )
                return [results[0]]

        return []
