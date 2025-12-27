import re
from typing import List, Dict, Any

from ..base_command import OLTCommand

class GetOntInfoCliCommand(OLTCommand):
    """Command to execute 'display ont info' and parse its output via CLI."""

    def __init__(self, port: str = None, ont_id: int = None, serial_number: str = None):
        if not any([port, serial_number]):
            raise ValueError("Either port or serial_number must be provided.")
        
        self.port = port
        self.ont_id = ont_id
        self.serial_number = serial_number

    def execute(self, connection_manager, olt_version: str) -> List[Dict[str, Any]]:
        if self.serial_number:
            command_str = f"display ont info by-sn {self.serial_number}"
        elif self.port and self.ont_id is not None:
            command_str = f"display ont info {self.port} {self.ont_id}"
        else: # Assumes querying all ONTs on a port
            command_str = f"display ont info {self.port} all"

        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        """Private method to parse output, aware of the OLT version."""
        # For now, we only have one parser. We can add more with if/elif/else.
        # if olt_version.startswith("V800R019"):
        #     return self._parse_r019(raw_output)
        return self._parse_default(raw_output)

    def _parse_default(self, raw_output: str) -> List[Dict[str, Any]]:
        onts = []
        # This regex is for the summary line from 'display ont info <port> all'
        # Example line:
        # 0/1/0   0       4857544312345678  active        online      normal      ...
        pattern = re.compile(
            r"^\s*(?P<port>\d+/\d+/\d+)\s+"
            r"(?P<ont_id>\d+)\s+"
            r"(?P<serial_number>[A-Z0-9\-]+)\s+"
            r"(?P<control_flag>\w+)\s+"
            r"(?P<run_state>\w+)\s+"
            r"(?P<config_state>\w+)",
            re.MULTILINE
        )

        for match in pattern.finditer(raw_output):
            ont_data = match.groupdict()
            ont_data['ont_id'] = int(ont_data['ont_id'])
            onts.append(ont_data)

        # If no ONTs were found with the table pattern, it might be a detailed view from by-sn/by-id.
        if not onts:
            detail_pattern = re.compile(
                r"F/S/P\s+:\s+(?P<port>\d+/\d+/\d+).*"
                r"ONT-ID\s+:\s+(?P<ont_id>\d+).*"
                r"Serial\snumber\s+:\s+(?P<serial_number>[A-Z0-9\-]+).*"
                r"Control\sflag\s+:\s+(?P<control_flag>\w+).*"
                r"Run\sstate\s+:\s+(?P<run_state>\w+).*"
                r"Config\sstate\s+:\s+(?P<config_state>\w+).*",
                re.DOTALL | re.IGNORECASE
            )
            match = detail_pattern.search(raw_output)
            if match:
                ont_data = match.groupdict()
                # Clean up whitespace from dictionary values
                ont_data = {k: v.strip() for k, v in ont_data.items()}
                ont_data['ont_id'] = int(ont_data['ont_id'])
                onts.append(ont_data)

        return onts
