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
        Executa a sequência de comandos para reiniciar uma ONU.
        Usa timing para lidar com a confirmação interativa (y/n).
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
            # Entrar no modo de configuração e na interface
            connection.send_command("config")
            connection.send_command(interface_cmd)
            
            # Envia o comando de reset usando timing (não espera prompt específico)
            # O parâmetro use_timing=True é suportado pelo nosso ConnectionManager
            cmd = f"ont reset {ont_port_idx} {self.ont_id}"
            connection.send_command(cmd, use_timing=True)
            
            # Envia a confirmação 'y' e aguarda a execução
            output = connection.send_command("y", use_timing=True)
            
            # Retorna ao modo raiz
            connection.send_command("return")
            
            logger.info(f"Comando de reboot enviado para ONU {self.ont_id}.")
            return {"status": "success", "message": "Reboot command sent", "details": output}

        except Exception as e:
            logger.error(f"Erro ao tentar reiniciar ONU {self.ont_id}: {e}")
            try:
                connection.send_command("return")
            except:
                pass
            return {"status": "error", "message": str(e)}
