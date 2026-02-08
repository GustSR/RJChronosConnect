from typing import Dict, Any
from ....core.logging import get_logger
from ....services.connection_manager import ConnectionManager

logger = get_logger(__name__)

class RebootOntCommand:
    def __init__(self, port: str, ont_id: int):
        self.port = port
        self.ont_id = ont_id

    def execute(self, connection: ConnectionManager, olt_version: str) -> Dict[str, Any]:
        """
        Reinicia uma ONU.
        
        Usa send_command_safe que lida automaticamente com confirmação (y/n).
        """
        parts = self.port.split('/')
        if len(parts) == 3:
            frame, slot, port_idx = parts
            interface_cmd = f"interface gpon {frame}/{slot}"
            ont_port_idx = port_idx
        else:
            raise ValueError(f"Formato de porta inválido: {self.port}")

        logger.info(f"Reiniciando ONU {self.ont_id} na porta {self.port}...")

        try:
            # Garante modo global limpo
            connection.send_command_safe("return")
            connection.send_command_safe("config")
            connection.send_command_safe(interface_cmd)
            
            # O comando ont reset pede confirmação (y/n)
            # send_command_safe detecta e envia 'y' automaticamente
            cmd = f"ont reset {ont_port_idx} {self.ont_id}"
            output = connection.send_command_safe(cmd)
            
            connection.send_command_safe("return")
            
            logger.info(f"Comando de reboot processado para ONU {self.ont_id}.")
            return {"status": "success", "message": "Rebooted", "details": output}

        except Exception as e:
            logger.error(f"Erro no reboot: {e}")
            try:
                connection.send_command_safe("return")
            except:
                pass
            return {"status": "error", "message": str(e)}

