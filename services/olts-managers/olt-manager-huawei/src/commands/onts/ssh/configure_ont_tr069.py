from typing import Dict, Any
from ....core.logging import get_logger
from ....services.connection_manager import ConnectionManager

logger = get_logger(__name__)

class ConfigureOntTr069Command:
    """
    Vincula a ONU ao perfil TR-069.
    
    NOTA: O IP de gerência (ip-index) é configurado pelo comando `ont ipconfig`
    via ConfigureOntWanCommand, NÃO por um comando separado.
    """
    
    def __init__(self, port: str, ont_id: int, profile_id: int = 2):
        self.port = port
        self.ont_id = ont_id
        self.profile_id = profile_id

    def execute(self, connection: ConnectionManager, olt_version: str) -> Dict[str, Any]:
        """
        Vincula a ONU ao perfil TR-069.
        
        Fluxo: enable -> config -> interface gpon F/S -> ont tr069-server-config -> return
        """
        parts = self.port.split('/')
        if len(parts) == 3:
            frame, slot, port_idx = parts
            interface_cmd = f"interface gpon {frame}/{slot}"
            ont_port_idx = port_idx
        else:
            raise ValueError(f"Formato de porta inválido para TR069 config: {self.port}")

        logger.info(f"Vinculando ONU {self.ont_id} ao perfil TR-069 ID {self.profile_id}...")

        try:
            # Entra em modo config (o connection_manager garante o enable)
            connection.send_command("config")
            connection.send_command(interface_cmd)

            # Comando para vincular ao perfil TR-069
            # Sintaxe: ont tr069-server-config <port> <ont-id> profile-id <profile-id>
            cmd_profile = " ".join(
                [
                    "ont",
                    "tr069-server-config",
                    str(ont_port_idx),
                    str(self.ont_id),
                    "profile-id",
                    str(self.profile_id),
                ]
            )
            out_profile = connection.send_command(cmd_profile)
            
            # Volta para o modo raiz
            connection.send_command("return")
            
            error_markers = ("failure", "error", "unknown command", "too many parameters", "incomplete command")
            if any(marker in out_profile.lower() for marker in error_markers):
                logger.error(f"Falha no binding do perfil TR-069: {out_profile}")
                return {"status": "error", "message": f"Binding failed: {out_profile}"}

            logger.info(f"TR-069 vinculado com sucesso (Profile ID: {self.profile_id}).")
            return {
                "status": "success", 
                "message": "TR-069 configured", 
                "details": {"output": out_profile}
            }
            
        except Exception as e:
            logger.error(f"Erro inesperado no ConfigureOntTr069Command: {e}")
            try:
                connection.send_command("return")
            except:
                pass
            raise e
