from typing import Dict, Any

from ...base_command import OLTCommand


class DeleteOntCommand(OLTCommand):
    """Command to remove an ONT from a PON via CLI."""

    def __init__(self, port: str, ont_id: int):
        self.port = port
        self.ont_id = ont_id

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        command_str = f"ont delete {self.port} {self.ont_id}"
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        if "success" in raw_output.lower():
            status = "success"
        elif "fail" in raw_output.lower() or "error" in raw_output.lower():
            status = "failure"
        else:
            status = "unknown"
        return {"status": status, "raw_output": raw_output}
