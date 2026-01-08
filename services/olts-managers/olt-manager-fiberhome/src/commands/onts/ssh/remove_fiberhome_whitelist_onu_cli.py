from typing import Dict, Any

from ...base_command import OLTCommand


class RemoveFiberhomeWhitelistOnuCliCommand(OLTCommand):
    """Command to remove an ONU from whitelist via CLI."""

    def __init__(self, serial_number: str, slot: int, link: int):
        self.serial_number = serial_number
        self.slot = slot
        self.link = link

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        command_str = (
            "set whitelist phy_addr del "
            f"{self.serial_number} slot {self.slot} link {self.link}"
        )
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
