import re
from typing import List, Dict, Any
from .base_command import OLTCommand

class DisplayBoardCommand(OLTCommand):
    """Command to execute 'display board' and parse its output."""

    def __init__(self, frame_id: int):
        self.frame_id = frame_id

    def execute(self, connection_manager, olt_version: str) -> List[Dict[str, Any]]:
        command_str = f"display board {self.frame_id}"
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        """Parses the output of the 'display board' command."""
        board_info = []
        # Regex to capture the board information from the table
        pattern = re.compile(
            r"^\s*(?P<board_id>\d+)\s+"
            r"(?P<board_type>\S+)\s+"
            r"(?P<status>\w+)\s*"
            r"(?P<sub_type_b>\S*)\s*"
            r"(?P<sub_type_c>\S*)\s*"
            r"(?P<online>\S*)",
            re.MULTILINE
        )

        for match in pattern.finditer(raw_output):
            info = match.groupdict()
            # Clean up empty strings to be None
            for key, value in info.items():
                if not value.strip():
                    info[key] = None
            info['board_id'] = int(info['board_id'])
            board_info.append(info)

        return board_info
