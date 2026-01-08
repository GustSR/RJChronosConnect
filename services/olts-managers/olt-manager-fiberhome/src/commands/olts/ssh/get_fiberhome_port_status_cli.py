from typing import Dict, Any, Optional

from ...base_command import OLTCommand


class GetFiberhomePortStatusCliCommand(OLTCommand):
    """Command to execute 'show port all' or 'show port <x:y>' via CLI."""

    def __init__(self, port: Optional[str] = None):
        self.port = port

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        if self.port:
            command_str = f"show port {self.port}"
        else:
            command_str = "show port all"
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        return {"raw_output": raw_output}
