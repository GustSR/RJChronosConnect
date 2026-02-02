import time
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
            frame, slot, port_idx = parts
            interface_cmd = f"interface gpon {frame}/{slot}"
            ont_port_idx = port_idx
        else:
            raise ValueError(f"Formato de porta inválido: {self.port}")

        logger.info(f"Reiniciando ONU {self.ont_id} na porta {self.port}...")

        try:
            connection.send_command("config")
            connection.send_command(interface_cmd)
            
            # 1. Envia comando de reset
            cmd = f"ont reset {ont_port_idx} {self.ont_id}"
            output = connection.send_command(cmd, expect_string=r"y/n", read_timeout=10)
            
            if "y/n" in output:
                logger.info("Confirmando reboot...")
                # 2. Envia 'y' (sem esperar prompt, pois ele pode pedir o Enter em seguida)
                connection.send_command("y", expect_string=r" ", read_timeout=2)
                # 3. Envia o ENTER final (comando vazio) e espera o prompt de volta (#)
                output += connection.send_command("", expect_string=r"#", read_timeout=15)
            
            connection.send_command("return")
            
            logger.info(f"ONU {self.ont_id} reiniciada.")
            return {"status": "success", "message": "Rebooted", "details": output}

        except Exception as e:
            logger.error(f"Erro no reboot: {e}")
            try:
                connection.send_command("return")
            except:
                pass
            return {"status": "error", "message": str(e)}
