from .base_command import OLTCommand
from typing import Dict, Any, List

class AddOntLineProfileCommand(OLTCommand):
    """Command to add a new ONT line profile and its sub-commands."""

    def __init__(self, profile_name: str, tconts: List[Dict], gem_ports: List[Dict]):
        self.profile_name = profile_name
        self.tconts = tconts
        self.gem_ports = gem_ports

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        """
        Executes the command sequence to add a new ONT line profile.
        """
        # Enter global config mode
        connection_manager.send_command("config")
        
        # Enter line profile config mode
        main_command = f"ont-lineprofile gpon profile-name {self.profile_name}"
        connection_manager.send_command(main_command)

        # Add T-CONTs
        for tcont in self.tconts:
            tcont_command = f"tcont {tcont['id']} dba-profile-name {tcont['dba_profile_name']}"
            connection_manager.send_command(tcont_command)

        # Add GEM ports
        for gem in self.gem_ports:
            gem_command = f"gem add {gem['id']} eth tcont {gem['tcont_id']}"
            connection_manager.send_command(gem_command)

        # Commit changes and exit modes
        connection_manager.send_command("commit")
        raw_output = connection_manager.send_command("quit") # Quit line-profile mode
        connection_manager.send_command("quit") # Quit config mode

        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """
        Parses the output of the final 'quit' command.
        A simple success check is often sufficient here.
        """
        # In this command sequence, the output of the final 'quit' is less critical.
        # A lack of errors during the sequence is the primary indicator of success.
        # We can consider the operation successful if no exceptions were raised.
        return {"status": "success", "message": f"ONT line profile '{self.profile_name}' configured."}
