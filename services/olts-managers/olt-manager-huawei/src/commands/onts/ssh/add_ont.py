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
        send = connection_manager.send_command
        use_timing = getattr(connection_manager, "protocol", "") == "telnet"
        if use_timing:
            send = connection_manager.send_command_timing
        outputs = []
        config_candidates = [
            "config",
            "system-view",
            "configure terminal",
            "conf t",
        ]

        enable_output = send("enable")
        outputs.append(("enable", enable_output))
        if "password" in enable_output.lower():
            password = None
            if hasattr(connection_manager, "get_password"):
                password = connection_manager.get_password()
            if password:
                enable_output += send(password)
                outputs[-1] = ("enable", enable_output)

        entered_config = False
        for cmd in config_candidates:
            config_output = send(cmd)
            outputs.append((cmd, config_output))
            if not self._is_error_output(config_output):
                entered_config = True
                break
        if not entered_config:
            return {
                "success": False,
                "message": "\n".join(output for _, output in outputs if output),
                "command": "config-entry/enable",
            }

        frame, slot, pon_port = self._split_port(self.port)
        # Enter interface mode (frame/slot)
        interface_command = f"interface gpon {frame}/{slot}"
        interface_output = send(interface_command)
        outputs.append((interface_command, interface_output))
        entered_interface = not self._is_error_output(interface_output)
        if not entered_interface:
            return {
                "success": False,
                "message": "\n".join(output for _, output in outputs if output),
                "command": interface_command,
            }
        
        line_profile = str(self.line_profile).strip()
        srv_profile = str(self.srv_profile).strip()
        line_profile_arg = self._format_profile_arg("ont-lineprofile", line_profile)
        srv_profile_arg = self._format_profile_arg("ont-srvprofile", srv_profile)
        desc = self._format_description(self.description)
        add_command = (
            f"ont add {pon_port} {self.ont_id} sn-auth {self.serial_number} omci "
            f"{line_profile_arg} {srv_profile_arg}{desc}"
        )
        
        # Send the command and capture the output
        raw_output = send(add_command)
        if self._needs_ont_type(raw_output):
            raw_output += self._handle_ont_type_prompt(connection_manager)
        
        # Exit back to user view (best-effort)
        try:
            connection_manager.send_command_timing("return")
        except Exception:
            pass

        return self._parse_output(raw_output, olt_version, command=add_command)

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
    def _is_error_output(output: str) -> bool:
        lower = output.lower()
        return "%" in output or "error" in lower or "unknown command" in lower or "unrecognized command" in lower

    @staticmethod
    def _format_description(description: str | None) -> str:
        if not description:
            return ""
        safe_desc = description.replace('"', "'").strip()
        if not safe_desc:
            return ""
        return f' desc "{safe_desc}"'

    @staticmethod
    def _needs_ont_type(output: str) -> bool:
        if not output:
            return False
        lower = output.lower()
        return "ont-type" in lower and "<cr>" in lower

    def _handle_ont_type_prompt(self, connection_manager) -> str:
        response = "\n"
        if self.ont_type:
            response = f"ont-type {self.ont_type}"
        return connection_manager.send_command_timing(response)

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
