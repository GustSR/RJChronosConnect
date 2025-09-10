import re
from typing import Dict, Any
from .base_command import OLTCommand

class AddGponAlarmProfileCommand(OLTCommand):
    """Command to execute 'gpon alarm-profile add' and parse its output."""

    def __init__(self, profile_id: int, profile_name: str):
        self.profile_id = profile_id
        self.profile_name = profile_name

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        command_str = f"gpon alarm-profile add profile-id {self.profile_id} profile-name {self.profile_name}"
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """Parses the output of the 'gpon alarm-profile add' command."""
        if "success" in raw_output.lower():
            return {"status": "success", "message": raw_output}
        else:
            return {"status": "error", "message": raw_output}
