from ..base_command import OLTCommand
from typing import Dict, Any

class AddDbaProfileCommand(OLTCommand):
    """Command to add a new DBA (Dynamic Bandwidth Allocation) profile."""

    def __init__(self, profile_name: str, profile_type: int, assure_kbps: int, max_kbps: int):
        self.profile_name = profile_name
        self.profile_type = profile_type
        self.assure_kbps = assure_kbps
        self.max_kbps = max_kbps

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        """
        Executes the command sequence to add a new DBA profile.
        """
        # Enter global config mode
        connection_manager.send_command("config")
        
        # Build and send the command
        command_str = (
            f"dba-profile add profile-name {self.profile_name} "
            f"type{self.profile_type} assure {self.assure_kbps} max {self.max_kbps}"
        )
        raw_output = connection_manager.send_command(command_str)
        
        # Exit config mode
        connection_manager.send_command("quit")

        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """
        Parses the output of the 'dba-profile add' command.
        """
        if "success" in raw_output.lower():
            return {"status": "success", "message": f"DBA profile '{self.profile_name}' added successfully."}
        elif "already exists" in raw_output.lower():
            return {"status": "failure", "message": f"DBA profile '{self.profile_name}' already exists."}
        elif "failure" in raw_output.lower() or "error" in raw_output.lower():
            return {"status": "failure", "message": raw_output}
        else:
            return {"status": "unknown", "message": raw_output}
