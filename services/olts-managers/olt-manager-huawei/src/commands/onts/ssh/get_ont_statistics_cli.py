from typing import Dict, Any

from ...base_command import OLTCommand


class GetOntStatisticsCliCommand(OLTCommand):
    """Command to execute 'display statistics ont-line' via CLI."""

    def __init__(self, port: str, ont_id: int):
        self.port = port
        self.ont_id = ont_id

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        command_str = f"display statistics ont-line {self.port} {self.ont_id}"
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        return {"raw_output": raw_output}
