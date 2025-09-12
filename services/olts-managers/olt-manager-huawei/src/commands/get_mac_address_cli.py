import re
from typing import List, Dict, Any

from .base_command import OLTCommand

class GetMacAddressCliCommand(OLTCommand):
    """Command to execute 'display mac-address' and parse its output."""

    def __init__(self, port: str, ont_id: int):
        self.port = port
        self.ont_id = ont_id

    def execute(self, connection_manager, olt_version: str) -> List[Dict[str, Any]]:
        command_str = f"display mac-address port {self.port} ont {self.ont_id}"
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        """Parses the output of the 'display mac-address' command."""
        mac_addresses = []
        # Regex to capture MAC address, VLAN, and other info
        # This is a simplified regex and might need to be adjusted for different OLT versions
        pattern = re.compile(
            r"""^\s*
            (?P<mac_address>[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4})\s+
            dynamic\s+
            (?P<vlan_id>\d+)\s+
            (?P<port>\d+/\d+/\d+)\s+
            (?P<ont_id>\d+)
            """, re.VERBOSE | re.MULTILINE
        )

        for match in pattern.finditer(raw_output):
            data = match.groupdict()
            mac_addresses.append({
                "mac_address": data["mac_address"],
                "vlan_id": int(data["vlan_id"]),
                "port": data["port"],
                "ont_id": int(data["ont_id"])
            })

        return mac_addresses
