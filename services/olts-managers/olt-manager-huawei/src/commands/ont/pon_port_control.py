from ..base_command import OLTCommand
from typing import Dict, Any

class PonPortControlCommand(OLTCommand):
    """Command to shut down or enable a PON port."""

    def __init__(self, port: str, action: str = 'shutdown'):
        self.port = port
        if action not in ['shutdown', 'enable']:
            raise ValueError("Action must be either 'shutdown' or 'enable'.")
        self.action = action

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        # The command needs to be executed within the specific GPON interface context
        frame, slot, pon_port = self.port.split('/')
        interface_command = f"interface gpon {frame}/{slot}"
        
        if self.action == 'shutdown':
            action_command = f"shutdown {pon_port}"
        else: # enable
            action_command = f"undo shutdown {pon_port}"

        # Send commands
        connection_manager.send_command(interface_command)
        raw_output = connection_manager.send_command(action_command)
        
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """Parse the output to confirm success."""
        # Success messages can be subtle. We assume success if no error is raised.
        # A more robust implementation could check for specific success or failure strings.
        if "failure" in raw_output.lower() or "error" in raw_output.lower():
            return {"status": "error", "message": raw_output}
        
        return {"status": "success", "message": f"Port {self.port} has been {self.action}d."}
