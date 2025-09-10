import re
from typing import Dict, Any
from .base_command import OLTCommand

class AddServicePortCommand(OLTCommand):
    """Command to execute 'service-port add' and parse its output."""

    def __init__(self, index: int, vlan_id: int, frame: int, slot: int, port: int, ont_id: int, gemport_id: int, user_vlan_id: int, tag_transform: str):
        self.index = index
        self.vlan_id = vlan_id
        self.frame = frame
        self.slot = slot
        self.port = port
        self.ont_id = ont_id
        self.gemport_id = gemport_id
        self.user_vlan_id = user_vlan_id
        self.tag_transform = tag_transform

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        gpon_port = f"{self.frame}/{self.slot}/{self.port}"
        command_str = f"service-port {self.index} vlan {self.vlan_id} gpon {gpon_port} ont {self.ont_id} gemport {self.gemport_id} multi-service user-vlan {self.user_vlan_id} tag-transform {self.tag_transform}"
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """Parses the output of the 'service-port add' command."""
        if "success" in raw_output.lower():
            return {"status": "success", "message": raw_output}
        else:
            return {"status": "error", "message": raw_output}
