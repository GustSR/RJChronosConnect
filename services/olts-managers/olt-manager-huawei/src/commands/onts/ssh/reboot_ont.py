import re
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

        def _needs_confirmation(text: str) -> bool:
            if not text:
                return False
            lower_text = text.lower()
            if "are you sure" in lower_text:
                return True
            return bool(re.search(r"\(y/n\)|y/n|\[y/n\]|\(y\/n\)", lower_text))

        try:
            connection.send_command("config")
            connection.send_command(interface_cmd)
            
            # Usando acesso direto ao canal para máxima precisão no diálogo interativo
            channel = connection.connection
            channel.write_channel(f"ont reset {ont_port_idx} {self.ont_id}\n")
            
            # Aguarda a pergunta y/n (com múltiplas leituras para evitar perda do prompt)
            output = ""
            for _ in range(10):
                time.sleep(0.5)
                output += channel.read_channel()
                if _needs_confirmation(output):
                    logger.info("Confirmando reboot (y + ENTER)...")
                    channel.write_channel("y\n")
                    time.sleep(2)
                    output += channel.read_channel()
                    break
            
            connection.send_command("return")
            
            logger.info(f"Comando de reboot processado para ONU {self.ont_id}.")
            return {"status": "success", "message": "Rebooted", "details": output}

        except Exception as e:
            logger.error(f"Erro no reboot: {e}")
            try:
                connection.send_command("return")
            except:
                pass
            return {"status": "error", "message": str(e)}
