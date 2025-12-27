from ..base_command import OLTCommand
from typing import Dict, Any

class AddOntCommand(OLTCommand):
    """Command to provision a new ONT on the OLT."""

    def __init__(self, port: str, ont_id: int, serial_number: str, line_profile: str, srv_profile: str):
        self.port = port
        self.ont_id = ont_id
        self.serial_number = serial_number
        self.line_profile = line_profile
        self.srv_profile = srv_profile

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        """
        Executes the command sequence to add a new ONT.
        Enters config mode, then interface mode, adds the ONT, and exits.
        """
        # Enter global config mode
        connection_manager.send_command("config")
        
        # Enter interface mode
        interface_command = f"interface gpon {self.port}"
        connection_manager.send_command(interface_command)
        
        # Build the main command
        # Using SN authentication as an example. This could be more complex.
        add_command = (
            f"ont add {self.ont_id} sn-auth {self.serial_number} omci "
            f"ont-lineprofile-name {self.line_profile} ont-srvprofile-name {self.srv_profile}"
        )
        
        # Send the command and capture the output
        raw_output = connection_manager.send_command(add_command)
        
        # Exit interface and config modes
        connection_manager.send_command("quit")
        connection_manager.send_command("quit")

        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """
        Parses the output of the 'ont add' command to check for success or failure.
        """
        if "success" in raw_output.lower():
            return {"status": "success", "message": raw_output}
        elif "fail" in raw_output.lower() or "error" in raw_output.lower():
            return {"status": "failure", "message": raw_output}
        else:
            # If no clear success/fail message, return the output for manual inspection
            return {"status": "unknown", "message": raw_output}
