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

            # 1. Vincular o servidor (Validando saída)
            cmd_profile = f"ont tr069-server-config {ont_port_idx} {self.ont_id} profile-id {self.profile_id}"
            out_profile = connection.send_command(cmd_profile)
            
            if "Failure" in out_profile or "Error" in out_profile:
                logger.error(f"Falha no binding do profile TR-069: {out_profile}")
                connection.send_command("return")
                return {"status": "error", "message": f"Binding failed: {out_profile}"}

            # 2. Definir por qual interface IP a gerência vai sair
            cmd_mgmt = f"ont tr069-management {ont_port_idx} {self.ont_id} ip-index {self.ip_index}"
            out_mgmt = connection.send_command(cmd_mgmt)
            
            connection.send_command("return")

            if "Failure" in out_mgmt or "Error" in out_mgmt:
                 logger.error(f"Falha ao configurar TR-069 Management: {out_mgmt}")
                 return {"status": "error", "message": f"Management config failed: {out_mgmt}"}

            logger.info("TR-069 (Binding + Management) configurado com sucesso.")
            return {
                "status": "success", 
                "message": "TR-069 configured", 
                "details": {"profile": out_profile, "management": out_mgmt}
            }
            
        except Exception as e:
            logger.error(f"Erro inesperado no ConfigureOntTr069Command: {e}")
            try:
                connection.send_command("return")
            except:
                pass
            raise e
