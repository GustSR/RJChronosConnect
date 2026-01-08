from typing import Any, Dict, Optional

from ...base_command import OLTCommand


class CreateFiberhomeVlanCliCommand(OLTCommand):
    """Create a VLAN on Fiberhome OLT via CLI."""

    def __init__(self, vlan_id: int, vlan_type: Optional[str] = "smart"):
        self.vlan_id = vlan_id
        self.vlan_type = vlan_type

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        if not (1 <= self.vlan_id <= 4094):
            raise ValueError("vlan_id must be between 1 and 4094")

        command = f"create vlan {self.vlan_id}"
        if self.vlan_type:
            command += f" {self.vlan_type}"

        raw_output = connection_manager.send_command(command)
        result = self._parse_output(raw_output, olt_version)
        result.update({"vlan_id": self.vlan_id, "vlan_type": self.vlan_type})
        return result

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        output = raw_output.lower()
        if "success" in output:
            status = "success"
        elif "fail" in output or "error" in output:
            status = "failure"
        else:
            status = "unknown"
        return {"status": status, "raw_output": raw_output}


class DeleteFiberhomeVlanCliCommand(OLTCommand):
    """Delete a VLAN on Fiberhome OLT via CLI."""

    def __init__(self, vlan_id: int):
        self.vlan_id = vlan_id

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        if not (1 <= self.vlan_id <= 4094):
            raise ValueError("vlan_id must be between 1 and 4094")

        command = f"delete vlan {self.vlan_id}"
        raw_output = connection_manager.send_command(command)
        result = self._parse_output(raw_output, olt_version)
        result.update({"vlan_id": self.vlan_id})
        return result

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        output = raw_output.lower()
        if "success" in output:
            status = "success"
        elif "fail" in output or "error" in output:
            status = "failure"
        else:
            status = "unknown"
        return {"status": status, "raw_output": raw_output}


class ListFiberhomeVlansCliCommand(OLTCommand):
    """List VLANs on Fiberhome OLT via CLI."""

    def __init__(self, show_all: bool = False):
        self.show_all = show_all

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        command = "show vlan all" if self.show_all else "show vlan"
        raw_output = connection_manager.send_command(command)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        return {"raw_output": raw_output}
