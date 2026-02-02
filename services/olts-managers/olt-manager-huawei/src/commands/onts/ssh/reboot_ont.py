from typing import Dict, Any
from ....core.logging import get_logger
from ....services.connection_manager import ConnectionManager

logger = get_logger(__name__)

class RebootOntCommand:
    """Command to reboot a specific ONT on the OLT."""

    def __init__(self, port: str, ont_id: int):
        self.port = port
        self.ont_id = ont_id

    def execute(self, connection: ConnectionManager, olt_version: str) -> Dict[str, Any]:
        """
        Executes the command sequence to reset an ONT.
        """
        # Parse da porta (Ex: "0/5/2" -> frame 0, slot 5, port 2)
        parts = self.port.split('/')
        if len(parts) == 3:
            frame, slot, port_idx = parts
            interface_cmd = f"interface gpon {frame}/{slot}"
            ont_port_idx = port_idx
        else:
            # Fallback para slot/porta
            parts_small = self.port.split('/')
            if len(parts_small) == 2:
                interface_cmd = f"interface gpon 0/{parts_small[0]}"
                ont_port_idx = parts_small[1]
            else:
                raise ValueError(f"Formato de porta inválido: {self.port}")

        logger.info(f"Reiniciando ONU {self.ont_id} na porta {self.port}...")

        try:
            connection.send_command("config")
            connection.send_command(interface_cmd)
            
            # Comando: ont reset <port> <id>
            cmd = f"ont reset {ont_port_idx} {self.ont_id}"
            
            # Algumas OLTs pedem confirmação (y/n)
            output = connection.send_command(cmd, expect_string=r"y/n|#", read_timeout=20)

            if "y/n" in output:
                logger.info("Confirmando reboot (y)...")
                output += connection.send_command("y", expect_string=r"#", read_timeout=20)
            
            connection.send_command("return")

            logger.info("Comando de reboot enviado com sucesso.")
            return {"status": "success", "message": "Reboot command sent", "details": output}

        except Exception as e:
            try:
                connection.send_command("return")
            except:
                pass
            raise e