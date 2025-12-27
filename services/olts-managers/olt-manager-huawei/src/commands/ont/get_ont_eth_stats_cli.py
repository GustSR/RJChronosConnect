import re
from typing import Dict, Any
from ..base_command import OLTCommand

class GetOntEthStatsCliCommand(OLTCommand):
    """Command to execute 'display statistics ont-eth' and parse its output."""

    def __init__(self, port: str, ont_id: int, eth_port_id: int):
        self.port = port
        self.ont_id = ont_id
        self.eth_port_id = eth_port_id

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        command_str = f"display statistics ont-eth {self.port} {self.ont_id} ont-port {self.eth_port_id}"
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """Parses the output of the 'display statistics ont-eth' command."""
        stats = {}
        patterns = {
            'packets_received': r"Packets received\s+:\s*(\d+)",
            'bytes_received': r"Bytes received\s+:\s*(\d+)",
            'unicast_packets_received': r"Unicast packets received\s+:\s*(\d+)",
            'broadcast_packets_received': r"Broadcast packets received\s+:\s*(\d+)",
            'multicast_packets_received': r"Multicast packets received\s+:\s*(\d+)",
            'packets_sent': r"Packets send\s+:\s*(\d+)",
            'bytes_sent': r"Bytes send\s+:\s*(\d+)",
            'unicast_packets_sent': r"Unicast packets send\s+:\s*(\d+)",
            'broadcast_packets_sent': r"Broadcast packets send\s+:\s*(\d+)",
            'multicast_packets_sent': r"Multicast packets send\s+:\s*(\d+)",
        }

        for key, pattern in patterns.items():
            match = re.search(pattern, raw_output)
            if match:
                stats[key] = int(match.group(1))
            else:
                stats[key] = 0

        return stats
