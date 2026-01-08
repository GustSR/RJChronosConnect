from typing import Dict, Any

from ...base_command import OLTCommand


class GetOltCpuMemCliCommand(OLTCommand):
    """Command to execute 'display cpu' and 'display mem' via CLI."""

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        cpu_output = connection_manager.send_command("display cpu")
        mem_output = connection_manager.send_command("display mem")
        return self._parse_output((cpu_output, mem_output), olt_version)

    def _parse_output(self, raw_output: Any, olt_version: str) -> Dict[str, Any]:
        cpu_output, mem_output = raw_output
        return {
            "cpu_output": cpu_output,
            "mem_output": mem_output,
        }
