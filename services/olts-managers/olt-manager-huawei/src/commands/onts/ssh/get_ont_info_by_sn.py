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
        # Limpar o SN para garantir que nao tenha espacos
        sn = self.serial_number.strip()
        
        cmd = f"display ont info by-sn {sn}"
        output = connection.send_command(cmd)
        
        results = []
        fsp = None
        ont_id = None
        
        # Parse rigoroso baseado no output real da OLT Huawei
        for line in output.splitlines():
            # Procura por "F/S/P" (pode ter espaços ou traços antes)
            if "F/S/P" in line and ":" in line:
                # Ex: "F/S/P                   : 0/5/2"
                parts = line.split(":", 1)
                if len(parts) > 1:
                    fsp = parts[1].strip()
            
            # Procura por "ONT-ID" ou "ONT ID"
            if "ONT-ID" in line and ":" in line:
                # Ex: "ONT-ID                  : 28"
                parts = line.split(":", 1)
                if len(parts) > 1:
                    # Pega apenas o primeiro bloco de texto (o numero)
                    val = parts[1].strip().split()[0]
                    ont_id = val

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
                logger.info(f"Parser CLI encontrou ONU {sn} em {fsp} com ID {ont_id}")
                return results
            except (ValueError, IndexError) as e:
                logger.error(f"Erro ao decompor FSP '{fsp}': {e}")

        # Se falhou o modo verbose, tenta o modo tabular (comum em outras versoes)
        for line in output.splitlines():
            # Regex para linha que começa com algo tipo " 0/5/2 "
            match = re.search(r'(\d+/\d+/\d+)\s+(\d+)', line)
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
                break
        
        return results
