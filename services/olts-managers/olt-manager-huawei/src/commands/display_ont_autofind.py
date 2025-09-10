import re
from typing import List, Dict, Any

from .base_command import OLTCommand

class DisplayOntAutofindCommand(OLTCommand):
    """Command to execute 'display ont autofind' and parse its output."""

    def __init__(self, port: str):
        self.port = port

    def execute(self, connection_manager, olt_version: str) -> List[Dict[str, Any]]:
        frame, slot, pon_port = self.port.split('/')
        interface_command = f"interface gpon {frame}/{slot}"
        command_str = f"display ont autofind {pon_port}"
        
        connection_manager.send_command(interface_command)
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        """Parses the output of the 'display ont autofind' command."""
        autofind_onts = []
        # Regex to capture autofind ONT information
        pattern = re.compile(
            r"""^\s*
            (?P<ont_id>\d+)\s+
            (?P<loid>\S+)\s+
            (?P<password>\S+)\s+
            (?P<serial_number>[0-9a-fA-F]+)\s+
            (?P<equipment_id>\S+)
            """, re.VERBOSE | re.MULTILINE
        )

        for match in pattern.finditer(raw_output):
            data = match.groupdict()
            data['port'] = self.port
            data['ont_id'] = int(data['ont_id'])
            autofind_onts.append(data)

        return autofind_onts
