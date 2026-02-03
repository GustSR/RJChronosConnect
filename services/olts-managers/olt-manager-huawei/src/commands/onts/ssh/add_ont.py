from ...base_command import OLTCommand
from typing import Dict, Any

class AddOntCommand(OLTCommand):
    """Command to provision a new ONT on the OLT."""

    def __init__(
        self,
        port: str,
        ont_id: int,
        serial_number: str,
        line_profile: str,
        srv_profile: str,
        description: str | None = None,
        ont_type: str | None = None,
    ):
        self.port = port
        self.ont_id = ont_id
        self.serial_number = serial_number
        self.line_profile = line_profile
        self.srv_profile = srv_profile
        self.description = description
        self.ont_type = ont_type

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        """
        Executes the command sequence to add a new ONT.
        Enters config mode, then interface mode, adds the ONT, and exits.
        """
        import time
        
        # 1. Enable e Config mode usando send_command_safe com timeout curto
        try:
            connection_manager.send_command_safe("enable", timeout=3.0)
        except:
            pass # Pode já estar em enable ou falhar, seguimos
            
        connection_manager.send_command_safe("config", timeout=3.0)
        
        # 2. Interface mode
        frame, slot, pon_port = self._split_port(self.port)
        interface_command = f"interface gpon {frame}/{slot}"
        connection_manager.send_command_safe(interface_command, timeout=3.0)
        
        # 3. Montar comando add
        line_profile = str(self.line_profile).strip()
        srv_profile = str(self.srv_profile).strip()
        line_profile_arg = self._format_profile_arg("ont-lineprofile", line_profile)
        srv_profile_arg = self._format_profile_arg("ont-srvprofile", srv_profile)
        desc = self._format_description(self.description)
        add_command = (
            f"ont add {pon_port} {self.ont_id} sn-auth {self.serial_number} omci "
            f"{line_profile_arg} {srv_profile_arg}{desc}"
        )
        
        # 4. Enviar comando ADD com tratamento especial para ont-type
        # Não usamos send_command_safe padrão pois precisamos decidir o que responder
        # ao prompt { <cr>|ont-type... }
        
        if not connection_manager.connection or not connection_manager.connection.is_alive():
             raise ConnectionError("Connection lost")
             
        # Limpa buffer
        if hasattr(connection_manager.connection, 'clear_buffer'):
            connection_manager.connection.clear_buffer()
            
        # Envia comando
        connection_manager.connection.write_channel(add_command + "\n")
        
        # Lê resposta e trata prompt interativo
        output = ""
        timeout = 10.0
        start_time = time.time()
        
        final_output = ""
        
        while (time.time() - start_time) < timeout:
            chunk = connection_manager.connection.read_channel()
            if chunk:
                output += chunk
                final_output += chunk
                
                # Prompt interativo comum de confirmação/opção
                if "{ <cr>" in output or "{<cr>" in output:
                    time.sleep(0.1)
                    if self.ont_type:
                        # Se temos tipo, enviamos
                        connection_manager.connection.write_channel(f"ont-type {self.ont_type}\n")
                    else:
                        # Padrão: Enter
                        connection_manager.connection.write_channel("\n")
                    
                    # Limpa output parcial para continuar lendo
                    output = "" 
                    continue
                
                # Prompt de erro ou sucesso final (volta pro prompt de comando)
                if "Failure" in output or "success" in output.lower():
                     # Espera curta para garantir prompt final
                     time.sleep(0.2)
                     final_output += connection_manager.connection.read_channel()
                     break
                     
                # Se achou prompt de interface
                if f"interface gpon {frame}/{slot}" in output or "(config-if-gpon" in output:
                    break
            else:
                time.sleep(0.2)
        
        # 5. Return (exit interface) - timeout curto
        connection_manager.send_command_safe("return", timeout=3.0)

        return self._parse_output(final_output, olt_version, command=add_command)

    @staticmethod
    def _format_profile_arg(prefix: str, value: str) -> str:
        if value.isdigit():
            return f"{prefix}-id {value}"
        return f"{prefix}-name {value}"

    @staticmethod
    def _split_port(port: str) -> tuple[str, str, str]:
        parts = port.split("/")
        if len(parts) != 3:
            raise ValueError("Port must be in frame/slot/port format")
        return parts[0], parts[1], parts[2]

    @staticmethod
    def _format_description(description: str | None) -> str:
        if not description:
            return ""
        safe_desc = description.replace('"', "'").strip()
        if not safe_desc:
            return ""
        return f' desc "{safe_desc}"'

    def _parse_output(self, raw_output: str, olt_version: str, command: str = None) -> Dict[str, Any]:
        """
        Parses the output of the 'ont add' command to check for success or failure.
        """
        lower = raw_output.lower()
        if "success" in lower:
            success = True
        elif "fail" in lower or "error" in lower or "unknown command" in lower:
            success = False
        else:
            success = False
        return {"success": success, "message": raw_output, "command": command}
