import re
from typing import Dict, Any
from ..base_command import OLTCommand

class SetPortModeCommand(OLTCommand):
    """Command to execute 'port mode' and parse its output."""

    def __init__(self, port: str, mode: str):
        self.port = port
        self.mode = mode

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        # This command needs to be executed in the context of the GPON interface
        parts = self.port.split('/')
        if len(parts) != 3:
            raise ValueError("Invalid port format. Expected F/S/P.")
        frame_slot = f"{parts[0]}/{parts[1]}"

        command_sequence = [
            "enable",
            "config",
            f"interface gpon {frame_slot}",
            f"port {parts[2]} mode {self.mode}",
            "quit",
            "quit"
        ]
        raw_output = ""
        for cmd in command_sequence:
            raw_output = connection_manager.send_command(cmd)

        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """Parses the output of the 'port mode' command."""
        if "success" in raw_output.lower():
            return {"status": "success", "message": raw_output}
        else:
            return {"status": "error", "message": raw_output}
