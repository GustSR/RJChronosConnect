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
        
        # Formato Verbose (Chave : Valor) - Comum em versoes mais novas/C300
        fsp = None
        ont_id = None
        
        for line in output.splitlines():
            line = line.strip()
            if line.startswith("F/S/P"):
                # Ex: "F/S/P                   : 0/5/2"
                parts = line.split(":", 1)
                if len(parts) > 1:
                    fsp = parts[1].strip()
            elif line.startswith("ONT-ID") or line.startswith("ONT ID"):
                # Ex: "ONT-ID                  : 28"
                parts = line.split(":", 1)
                if len(parts) > 1:
                    val = parts[1].strip()
                    ont_id = val.split()[0] # Pega so o numero

        if fsp and ont_id is not None:
            try:
                f, s, p = fsp.split('/')
                results.append({
                    "ont_id": int(ont_id),
                    "frame": int(f),
                    "slot": int(s),
                    "port": int(p),
                    "fsp": fsp,
                    "serial_number": self.serial_number
                })
                return results
            except ValueError:
                logger.warning(f"Erro ao parsear F/S/P: {fsp}")

        # Formato Tabular (Backup)
        # Procura por linhas que começam com numeros (F/S/P)
        for line in output.splitlines():
            if re.match(r'\s*\d+/\d+/\d+', line):
                parts = line.split()
                if len(parts) >= 2:
                    fsp = parts[0]
                    ont_id = parts[1]
                    try:
                        f, s, p = fsp.split('/')
                        results.append({
                            "ont_id": int(ont_id),
                            "frame": int(f),
                            "slot": int(s),
                            "port": int(p), # Pon port
                            "fsp": fsp,
                            "serial_number": self.serial_number
                        })
                    except:
                        continue
        
        return results