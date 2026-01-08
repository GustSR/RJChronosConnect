from typing import Any, Dict, List, Optional

from ...base_command import OLTCommand


class ConfigureFiberhomeOnuTr069CliCommand(OLTCommand):
    """Enable or disable TR-069 on an ONU via CLI."""

    def __init__(
        self,
        onu_id: int,
        enable: bool,
        acs_url: Optional[str] = None,
        acs_user: Optional[str] = None,
        acs_password: Optional[str] = None,
        inform_interval: Optional[int] = None,
        port: Optional[int] = None,
        cpe_user: Optional[str] = None,
        cpe_password: Optional[str] = None,
        middleware_disable: bool = True,
        interface_context: Optional[str] = None,
    ):
        self.onu_id = onu_id
        self.enable = enable
        self.acs_url = acs_url
        self.acs_user = acs_user
        self.acs_password = acs_password
        self.inform_interval = inform_interval
        self.port = port
        self.cpe_user = cpe_user
        self.cpe_password = cpe_password
        self.middleware_disable = middleware_disable
        self.interface_context = interface_context

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        command_str = self._build_command(olt_version)

        commands: List[str] = []
        if self.interface_context:
            commands.extend(["config", f"interface {self.interface_context}"])
        commands.append(command_str)
        if self.interface_context:
            commands.extend(["quit", "quit"])

        outputs = []
        command_output = ""
        for command in commands:
            raw_output = connection_manager.send_command(command)
            outputs.append({"command": command, "output": raw_output})
            if command == command_str:
                command_output = raw_output

        result = self._parse_output(command_output, olt_version)
        result.update(
            {
                "onu_id": self.onu_id,
                "enable": self.enable,
                "outputs": outputs,
                "interface_context": self.interface_context,
            }
        )
        return result

    def _build_command(self, olt_version: str, **kwargs) -> str:
        if not self.enable:
            return f"onu remote-manage-cfg {self.onu_id} tr069 disable"

        if not self.acs_url or not self.acs_user or not self.acs_password:
            raise ValueError("acs_url, acs_user, and acs_password are required when enabling TR-069")

        cpe_user = self.cpe_user or self.acs_user
        cpe_password = self.cpe_password or self.acs_password

        parts = [
            f"onu remote-manage-cfg {self.onu_id} tr069 enable",
            f"acs-url {self.acs_url}",
            f"acl-user {self.acs_user}",
            f"acl-pswd {self.acs_password}",
        ]

        if self.inform_interval is not None:
            parts.append(f"inform enable interval {self.inform_interval}")

        if self.port is not None:
            parts.append(f"port {self.port}")

        if cpe_user and cpe_password:
            parts.append(f"user {cpe_user}")
            parts.append(f"pswd {cpe_password}")

        parts.append("middleware disable" if self.middleware_disable else "middleware enable")

        return " ".join(parts)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        output = raw_output.lower()
        if "success" in output:
            status = "success"
        elif "fail" in output or "error" in output:
            status = "failure"
        else:
            status = "unknown"
        return {"status": status, "raw_output": raw_output}
