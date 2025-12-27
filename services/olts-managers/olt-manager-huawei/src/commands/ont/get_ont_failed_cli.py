import re
from typing import List, Dict, Any
from ..base_command import OLTCommand

class GetOntFailedCliCommand(OLTCommand):
    """Command to execute 'display ont failed' and parse its output."""

    def execute(self, connection_manager, olt_version: str) -> List[Dict[str, Any]]:
        # This command requires entering diagnose mode first.
        # This is a simplified way to handle context.
        command_sequence = [
            "diagnose",
            "display ont failed",
            "quit"
        ]
        raw_output = ""
        for cmd in command_sequence:
            raw_output = connection_manager.send_command(cmd)

        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        """Parses the output of the 'display ont failed' command."""
        failed_onts = []
        pattern = re.compile(
            r"^\s*(?P<fsp>\d+/\d+/\d+)\s+"
            r"(?P<ont_id>\d+)\s+"
            r"(?P<sn>[A-Z0-9]+)\s+"
            r"(?P<password>\S+)\s+"
            r"(?P<fail_time>\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\s+"
            r"(?P<fail_reason>.+)",
            re.MULTILINE
        )

        for match in pattern.finditer(raw_output):
            info = match.groupdict()
            info['ont_id'] = int(info['ont_id'])
            info['fail_reason'] = info['fail_reason'].strip()
            failed_onts.append(info)

        return failed_onts
