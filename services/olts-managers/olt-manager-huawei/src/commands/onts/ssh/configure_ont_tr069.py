from typing import Dict, Any
from ....core.logging import get_logger
from ....services.connection_manager import ConnectionManager

logger = get_logger(__name__)

class ConfigureOntTr069Command:
    def __init__(self, port: str, ont_id: int, profile_id: int, ip_index: int = 0):
        self.port = port
        self.ont_id = ont_id
        self.profile_id = profile_id
        self.ip_index = ip_index

    def execute(self, connection: ConnectionManager, olt_version: str) -> Dict[str, Any]:
        """
        Vincula a ONU ao perfil TR-069 e define o índice IP de gerência.
        """
        parts = self.port.split('/')
        if len(parts) == 3:
            frame, slot, port_idx = parts
            interface_cmd = f"interface gpon {frame}/{slot}"
            ont_port_idx = port_idx
        else:
            raise ValueError(f"Formato de porta inválido para TR069 config: {self.port}")

        logger.info(f"Configurando TR-069 na ONU {self.ont_id} (Profile {self.profile_id}, IP Index {self.ip_index})...")

        try:
            connection.send_command("config")
            connection.send_command(interface_cmd)

            # 1. Vincular o servidor
            cmd_profile = f"ont tr069-server-config {ont_port_idx} {self.ont_id} profile-id {self.profile_id}"
            connection.send_command(cmd_profile)
            
            # 2. Definir por qual interface IP a gerência vai sair (O PULO DO GATO)
            cmd_mgmt = f"ont tr069-management {ont_port_idx} {self.ont_id} ip-index {self.ip_index}"
            output = connection.send_command(cmd_mgmt)
            
            connection.send_command("return")

            if "Failure" in output or "Error" in output:
                 logger.error(f"Falha ao configurar TR-069 Management: {output}")
                 return {"status": "error", "message": output}

            logger.info("TR-069 configurado com sucesso.")
            return {"status": "success", "message": "TR-069 configured", "details": output}
            
        except Exception as e:
            try:
                connection.send_command("return")
            except:
                pass
            raise e