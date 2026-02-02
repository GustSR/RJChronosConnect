from typing import Dict, Any, Optional
from ....core.logging import get_logger
from ....services.connection_manager import ConnectionManager

logger = get_logger(__name__)

class ConfigureOntWanCommand:
    def __init__(
        self,
        port: str,
        ont_id: int,
        vlan: int,
        ip_mode: str = "dhcp",
        ip_address: Optional[str] = None,
        mask: Optional[str] = None,
        gateway: Optional[str] = None,
        ip_index: int = 0,
        priority: int = 2,
    ):
        self.port = port
        self.ont_id = ont_id
        self.vlan = vlan
        self.ip_mode = ip_mode.lower()
        self.ip_address = ip_address
        self.mask = mask
        self.gateway = gateway
        self.ip_index = ip_index
        self.priority = priority

    def execute(self, connection: ConnectionManager, olt_version: str) -> Dict[str, Any]:
        """
        Configura a interface WAN (IPoE) na ONU.
        """
        # Parse da porta (Ex: "0/5/2" -> interface gpon 0/5, ont 2)
        parts = self.port.split('/')
        if len(parts) == 3:
            frame, slot, port_idx = parts
            interface_cmd = f"interface gpon {frame}/{slot}"
            ont_port_idx = port_idx
        else:
            raise ValueError(f"Formato de porta inválido: {self.port}")

        logger.info(f"Configurando WAN na ONU {self.ont_id} (Porta {self.port}, VLAN {self.vlan}, Modo {self.ip_mode})...")

        # Sequência de comandos
        try:
            # Garante modo config
            connection.send_command("config")
            
            # Entra na interface
            connection.send_command(interface_cmd)

            # Montar comando
            if self.ip_mode == "dhcp":
                cmd = (
                    f"ont ipconfig {ont_port_idx} {self.ont_id} ip-index {self.ip_index} "
                    f"dhcp vlan {self.vlan} priority {self.priority}"
                )
            elif self.ip_mode == "static":
                if not all([self.ip_address, self.mask, self.gateway]):
                    raise ValueError("Para modo estático, IP, Máscara e Gateway são obrigatórios.")
                cmd = (
                    f"ont ipconfig {ont_port_idx} {self.ont_id} ip-index {self.ip_index} "
                    f"static ip-address {self.ip_address} mask {self.mask} gateway {self.gateway} "
                    f"vlan {self.vlan} priority {self.priority}"
                )
            else:
                logger.warning(f"Modo IP desconhecido: {self.ip_mode}. Pulando configuração de WAN.")
                connection.send_command("return") # Volta pra raiz
                return {"status": "skipped", "message": "Unknown IP mode"}

            # Executa configuração da WAN
            output = connection.send_command(cmd)
            
            # Volta para a raiz (mais seguro que quit)
            connection.send_command("return")

            if "Failure" in output or "Error" in output:
                 logger.error(f"Falha ao configurar WAN: {output}")
                 return {"status": "error", "message": output}

            logger.info("WAN configurada com sucesso.")
            return {"status": "success", "message": "WAN configured", "details": output}
            
        except Exception as e:
            # Tenta recuperar sessão
            try:
                connection.send_command("return")
            except:
                pass
            raise e
