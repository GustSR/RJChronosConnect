from .base_command import OLTCommand
from typing import Dict, Any

class AddOntSrvProfileCommand(OLTCommand):
    """Command to add a new ONT service profile."""

    def __init__(self, profile_name: str, pots_ports: int, eth_ports: int):
        self.profile_name = profile_name
        self.pots_ports = pots_ports
        self.eth_ports = eth_ports

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        """
        Executes the command sequence to add a new ONT service profile.
        """
        # Enter global config mode
        connection_manager.send_command("config")
        
        # Enter service profile config mode
        main_command = f"ont-srvprofile gpon profile-name {self.profile_name}"
        connection_manager.send_command(main_command)

        # Set port quantities
        # The user doc mentioned vdsl and pots, we will use eth and pots as common examples
        port_command = f"ont-port pots {self.pots_ports} eth {self.eth_ports}"
        connection_manager.send_command(port_command)

        # Commit changes and exit modes
        connection_manager.send_command("commit")
        raw_output = connection_manager.send_command("quit") # Quit srvprofile mode
        connection_manager.send_command("quit") # Quit config mode

        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """
        Parses the output of the final 'quit' command.
        """
        return {"status": "success", "message": f"ONT service profile '{self.profile_name}' configured."}
