from ..base_command import OLTCommand
from typing import Dict, Any

class RebootOntCommand(OLTCommand):
    """Command to reboot a specific ONT on the OLT."""

    def __init__(self, port: str, ont_id: int):
        self.port = port
        self.ont_id = ont_id

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        """
        Executes the command sequence to reset an ONT.
        """
        # Enter global config mode
        connection_manager.send_command("config")
        
        # Enter interface mode
        interface_command = f"interface gpon {self.port}"
        connection_manager.send_command(interface_command)
        
        # Build and send the reset command
        reset_command = f"ont reset {self.ont_id}"
        raw_output = connection_manager.send_command(reset_command, expect_string=r'y/n')

        # The OLT will ask for confirmation (y/n). We send 'y'.
        if "y/n" in raw_output:
            raw_output += connection_manager.send_command("y", expect_string=r'#')

        # Exit interface and config modes
        connection_manager.send_command("quit")
        connection_manager.send_command("quit")

        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """
        Parses the output of the 'ont reset' command.
        """
        if "success" in raw_output.lower():
            return {"status": "success", "message": "ONT reset command sent successfully."}
        elif "failure" in raw_output.lower() or "error" in raw_output.lower():
            return {"status": "failure", "message": raw_output}
        else:
            return {"status": "unknown", "message": raw_output}
