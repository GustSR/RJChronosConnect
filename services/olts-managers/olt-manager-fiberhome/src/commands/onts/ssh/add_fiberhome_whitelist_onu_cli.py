from typing import Dict, Any, Optional

from ...base_command import OLTCommand


class AddFiberhomeWhitelistOnuCliCommand(OLTCommand):
    """Command to add an ONU to whitelist via CLI."""

    def __init__(
        self,
        serial_number: str,
        slot: int,
        link: int,
        onu_id: int,
        onu_type: str,
        password: Optional[str] = None,
    ):
        self.serial_number = serial_number
        self.slot = slot
        self.link = link
        self.onu_id = onu_id
        self.onu_type = onu_type
        self.password = password or "null"

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        command_str = (
            "set whitelist phy_addr add "
            f"{self.serial_number} password {self.password} action add "
            f"slot {self.slot} link {self.link} onu {self.onu_id} type {self.onu_type}"
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
