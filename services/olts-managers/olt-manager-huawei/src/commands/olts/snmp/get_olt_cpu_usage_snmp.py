import asyncio
from typing import Any, Dict

from pysnmp.hlapi import v3arch

from ...base_command import OLTCommand


class GetOltCpuUsageSnmpCommand(OLTCommand):
    """Get board CPU usage via SNMP (Huawei MA5800)."""

    OID_BOARD_CPU_USAGE = "1.3.6.1.4.1.2011.2.6.7.1.1.2.1.5"

    def __init__(self, host: str, community_string: str, board_index: int):
        self.host = host
        self.community = community_string
        self.board_index = board_index

    def execute(self, connection_manager=None, olt_version: str = None) -> Dict[str, Any]:
        async def _execute_async() -> Dict[str, Any]:
            oid = f"{self.OID_BOARD_CPU_USAGE}.{self.board_index}"

            snmp_engine = v3arch.SnmpEngine()
            auth = v3arch.CommunityData(self.community, mpModel=1)
            transport = await v3arch.UdpTransportTarget.create((self.host, 161))
            context = v3arch.ContextData()

            error_indication, error_status, error_index, var_binds = await v3arch.get_cmd(
                snmp_engine,
                auth,
                transport,
                context,
                v3arch.ObjectType(v3arch.ObjectIdentity(oid)),
            )

            if error_indication:
                return {"error": str(error_indication)}
            if error_status:
                error_status_text = error_status.prettyPrint() if hasattr(error_status, "prettyPrint") else str(error_status)
                error_msg = f"{error_status_text} at {error_index and var_binds[int(error_index) - 1][0] or '??'}"
                return {"error": error_msg}

            raw_value = var_binds[0][1]
            try:
                cpu_usage_percent = float(raw_value)
            except (ValueError, TypeError):
                cpu_usage_percent = None

            return {
                "board_index": self.board_index,
                "cpu_usage_percent": cpu_usage_percent,
                "raw_value": str(raw_value),
            }

        return asyncio.run(_execute_async())

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        pass
