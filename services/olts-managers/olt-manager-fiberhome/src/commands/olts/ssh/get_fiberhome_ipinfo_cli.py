from typing import Dict, Any

from ...base_command import OLTCommand


class GetFiberhomeIpInfoCliCommand(OLTCommand):
    """Command to execute 'show ipinfo' via CLI."""

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        raw_output = connection_manager.send_command("show ipinfo")
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        return {"raw_output": raw_output}
