import re
from typing import Dict, Any
from .base_command import OLTCommand

class DisplayOntPortAttributeCommand(OLTCommand):
    """Command to execute 'display ont port attribute' and parse its output."""

    def __init__(self, port: str, ont_id: int, eth_port_id: int):
        self.port = port
        self.ont_id = ont_id
        self.eth_port_id = eth_port_id

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        command_str = f"display ont port attribute {self.port} {self.ont_id} eth {self.eth_port_id}"
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """Parses the output of the 'display ont port attribute' command."""
        attributes = {}
        patterns = {
            'admin_state': r"Admin-state\s+:\s*(\w+)",
            'link_state': r"Link-state\s+:\s*(\w+)",
            'speed': r"Speed\s+:\s*(\w+)",
            'duplex': r"Duplex\s+:\s*(\w+)"
        }

        for key, pattern in patterns.items():
            match = re.search(pattern, raw_output)
            if match:
                attributes[key] = match.group(1)
            else:
                attributes[key] = "N/A"

        return attributes
