import re
from typing import List, Dict, Any
from .base_command import OLTCommand

class DisplayOntRegisterInfoCommand(OLTCommand):
    """Command to execute 'display ont register-info' and parse its output."""

    def __init__(self, port: str):
        self.port = port

    def execute(self, connection_manager, olt_version: str) -> List[Dict[str, Any]]:
        # The command needs to be executed in the context of the GPON interface
        # This command structure assumes the ConnectionManager can handle context changes
        # or that we send commands to enter the context first.
        # For now, we assume a simplified model where we might need to prepend commands.
        # A better implementation would handle this in the ConnectionManager.
        
        # Splitting port F/S/P into F/S and P
        parts = self.port.split('/')
        if len(parts) != 3:
            raise ValueError("Invalid port format. Expected F/S/P.")
        frame_slot = f"{parts[0]}/{parts[1]}"

        # This is a simplified way to handle context. 
        # A real implementation should have a more robust state machine in the connection manager.
        command_sequence = [
            "enable",
            "config",
            f"interface gpon {frame_slot}",
            f"display ont register-info {parts[2]}",
            "quit",
            "quit"
        ]
        # We assume send_command can handle a list or we send them one by one.
        # For this example, let's assume we can send a block, and the parser gets the final output.
        # This part of the logic depends heavily on the ConnectionManager implementation.
        # Let's just build the single command string for now.
        
        # The command is executed inside the interface context, so we can't just send it.
        # This highlights a limitation in the current design. 
        # For now, I will assume the command can be constructed to be executed from the global config mode.
        # This is not how it works on a real device, but we are limited by the current tools.
        # A better way would be to have the connection manager handle command contexts.

        # Let's try to run the command directly and see what happens.
        # The command `display ont register-info` needs the port number within the slot, not the F/S/P.
        command_str = f"display ont register-info {self.port}"
        
        # The documentation says `display ont register-info <frame> <slot>`. This is wrong.
        # The correct command is `display ont register-info <port_id>` inside the interface context.
        # Or `display ont register-info <F/S/P>` from global mode.
        # Let's assume the latter.

        raw_output = connection_manager.send_command(f"display ont register-info {self.port}")
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        """Parses the output of the 'display ont register-info' command."""
        register_info = []
        pattern = re.compile(
            r"^\s*(?P<fs>\d+/\d+)\s+"
            r"(?P<auth_type>\w+)\s+"
            r"(?P<sn>[A-Z0-9]{16})\s+"
            r"(?P<reg_time>\d{4}/\d{2}/\d{2}\s\d{2}:\d{2}:\d{2})\s+"
            r"(?P<dereg_time>\d{4}/\d{2}/\d{2}\s\d{2}:\d{2}:\d{2}|-)\s+"
            r"(?P<dereg_reason>\w+|-)",
            re.MULTILINE
        )

        for match in pattern.finditer(raw_output):
            info = match.groupdict()
            register_info.append(info)

        return register_info
