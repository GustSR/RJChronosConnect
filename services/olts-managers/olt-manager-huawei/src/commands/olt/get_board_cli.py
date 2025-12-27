import re
from typing import List, Dict, Any
from ..base_command import OLTCommand
from ...core.parsers import robust_parser

class GetBoardCliCommand(OLTCommand):
    """Command to execute 'display board' and parse its output via CLI."""

    def __init__(self, frame_id: int):
        self.frame_id = frame_id

    def execute(self, connection_manager, olt_version: str) -> List[Dict[str, Any]]:
        command_str = f"display board {self.frame_id}"
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        """Parses the output of the 'display board' command using robust parser."""
        results = robust_parser.parse_command_output(
            command_name="display_board", 
            raw_output=raw_output, 
            firmware_version=olt_version
        )
        
        # Pós-processamento específico
        for result in results:
            if 'board_id' in result and result['board_id']:
                try:
                    result['board_id'] = int(result['board_id'])
                except (ValueError, TypeError):
                    pass  # Mantém como string se não conseguir converter
        
        return results
