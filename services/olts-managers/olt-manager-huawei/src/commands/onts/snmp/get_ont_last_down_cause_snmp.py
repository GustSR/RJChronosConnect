import asyncio
from typing import Any, Dict

from pysnmp.hlapi import v3arch

from ...base_command import OLTCommand


class GetOntLastDownCauseSnmpCommand(OLTCommand):
    """Get ONT last down cause via SNMP (Huawei MA5800)."""

    OID_ONT_LAST_DOWN_CAUSE = "1.3.6.1.4.1.2011.6.128.1.1.2.46.1.24"

    def __init__(self, host: str, community_string: str, port: str, ont_id: int):
        self.host = host
        self.community = community_string
        self.port_str = port
        self.ont_id = ont_id

    def execute(self, connection_manager=None, olt_version: str = None) -> Dict[str, Any]:
        async def _execute_async() -> Dict[str, Any]:
            ont_index = self._calculate_ont_index(self.port_str, self.ont_id)
            oid = f"{self.OID_ONT_LAST_DOWN_CAUSE}.{ont_index}"

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
                cause_code = int(raw_value)
            except (ValueError, TypeError):
                cause_code = None

            cause_map = {
                1: "los",
                13: "dying-gasp",
            }

            return {
                "port": self.port_str,
                "ont_id": self.ont_id,
                "cause_code": cause_code,
                "cause": cause_map.get(cause_code, "unknown"),
                "raw_value": str(raw_value),
            }

        return asyncio.run(_execute_async())

    def _calculate_ont_index(self, port_str: str, ont_id: int) -> str:
        try:
            frame, slot, port = map(int, port_str.split('/'))
        except (ValueError, IndexError):
            return str(ont_id)

        calculated_index = (frame * 1000000) + (slot * 10000) + (port * 100) + ont_id
        return str(calculated_index)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        pass
