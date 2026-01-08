import re
from typing import Dict, Any

from ...base_command import OLTCommand


class GetOntOpticalInfoCliCommand(OLTCommand):
    """Command to execute 'display ont optical-info' via CLI."""

    def __init__(self, port: str, ont_id: int):
        self.port = port
        self.ont_id = ont_id

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        command_str = f"display ont optical-info {self.port} {self.ont_id}"
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        patterns = {
            "rx_power": r"Rx\s+optical\s+power\s*\(dBm\)\s*:\s*([-0-9.]+)",
            "tx_power": r"Tx\s+optical\s+power\s*\(dBm\)\s*:\s*([-0-9.]+)",
            "olt_rx_power": r"OLT\s+Rx\s+optical\s+power\s*\(dBm\)\s*:\s*([-0-9.]+)",
            "olt_tx_power": r"OLT\s+Tx\s+optical\s+power\s*\(dBm\)\s*:\s*([-0-9.]+)",
            "temperature": r"Temperature\s*\(C\)\s*:\s*([-0-9.]+)",
        }

        result = {"raw_output": raw_output}
        for key, pattern in patterns.items():
            match = re.search(pattern, raw_output, re.IGNORECASE)
            if match:
                try:
                    result[key] = float(match.group(1))
                except (ValueError, TypeError):
                    result[key] = match.group(1)

        return result
