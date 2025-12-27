from ..base_command import OLTCommand
from typing import Dict, Any

class OntConfirmCommand(OLTCommand):
    """Command to confirm a discovered ONT."""

    def __init__(self, port: str, ont_id: int, serial_number: str, ont_line_profile_name: str, ont_srv_profile_name: str):
        self.port = port
        self.ont_id = ont_id
        self.serial_number = serial_number
        self.ont_line_profile_name = ont_line_profile_name
        self.ont_srv_profile_name = ont_srv_profile_name

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        frame, slot, pon_port = self.port.split('/')
        interface_command = f"interface gpon {frame}/{slot}"
        
        command_str = (
            f"ont confirm {pon_port} ontid {self.ont_id} sn-auth {self.serial_number} "
            f"omci ont-lineprofile-name {self.ont_line_profile_name} "
            f"ont-srvprofile-name {self.ont_srv_profile_name}"
        )

        connection_manager.send_command(interface_command)
        raw_output = connection_manager.send_command(command_str)
        
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """Parse the output to confirm success."""
        if "success" in raw_output.lower():
            return {"status": "success", "message": f"ONT {self.ont_id} on port {self.port} confirmed successfully."}
        elif "already exists" in raw_output.lower():
            return {"status": "error", "message": f"ONT {self.ont_id} on port {self.port} already exists."}
        else:
            return {"status": "error", "message": raw_output}
