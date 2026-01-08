from typing import Dict, Any

from ...base_command import OLTCommand


class GetFiberhomeOnuDiscoveryCliCommand(OLTCommand):
    """Command to execute 'show discovery slot <s> link <l>' via CLI."""

    def __init__(self, slot: int, link: int):
        self.slot = slot
        self.link = link

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        command_str = f"show discovery slot {self.slot} link {self.link}"
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        return {"raw_output": raw_output}
