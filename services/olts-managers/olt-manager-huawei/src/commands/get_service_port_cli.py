import re
from typing import List, Dict, Any

from .base_command import OLTCommand

class GetServicePortCliCommand(OLTCommand):
    """Command to execute 'display service-port' for a specific ONT."""

    def __init__(self, port: str, ont_id: int):
        self.port = port
        self.ont_id = ont_id

    def execute(self, connection_manager, olt_version: str) -> List[Dict[str, Any]]:
        command_str = f"display service-port port {self.port} ont {self.ont_id}"
        
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        """Parses the service-port information output."""
        service_ports = []
        # This regex is a placeholder for a realistic, but potentially complex, table.
        # Example line: 4   0/1/0   1   gpon  -  101   101   vlan 101   traffic-table-name fttd_100M
        pattern = re.compile(
            r'''
            ^\s*
            (?P<index>\d+)\s+
            (?P<port>\d+/\d+/\d+)\s+
            (?P<ont_id>\d+)\s+
            (?P<port_type>\w+)\s+
            (?P<something>\S+)\s+ # Placeholder for a column that might not be needed
            (?P<vlan_id>\d+)\s+
            (?P<something_else>\d+)\s+ # Placeholder
            vlan\s+(?P<vlan_again>\d+)\s+
            traffic-table-name\s+(?P<traffic_profile>\S+)
            ''', re.VERBOSE | re.MULTILINE | re.IGNORECASE
        )

        for match in pattern.finditer(raw_output):
            data = match.groupdict()
            service_ports.append({
                "index": int(data['index']),
                "vlan_id": int(data['vlan_id']),
                "traffic_profile": data['traffic_profile'],
                "port": data['port'],
                "ont_id": int(data['ont_id'])
            })

        return service_ports
