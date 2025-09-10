import re
from typing import Dict, Any
from .base_command import OLTCommand

class DisplayPortStateCommand(OLTCommand):
    """Command to execute 'display port state' and parse its output."""

    def __init__(self, port: str):
        self.port = port

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        command_str = f"display port state {self.port}"
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """Parses the output of the 'display port state' command."""
        attributes = {}
        patterns = {
            'admin_state': r"Admin-state\s+:\s*(\w+)",
            'link_state': r"Link-state\s+:\s*(\w+)",
        }

        for key, pattern in patterns.items():
            match = re.search(pattern, raw_output)
            if match:
                attributes[key] = match.group(1)
            else:
                attributes[key] = "N/A"

        return attributes
