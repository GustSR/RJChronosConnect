import asyncio
from typing import Any, Dict

from pysnmp.hlapi import v3arch
from pysnmp.proto.rfc1902 import Integer

from ...base_command import OLTCommand


class SetFiberhomeOntDeauthorizeSnmpCommand(OLTCommand):
    """Deauthorize an ONU via SNMP set (Fiberhome AN5116)."""

    OID_ONU_DEAUTHORIZE = "1.3.6.1.4.1.5875.800.3.10.1.1.180"

    def __init__(self, host: str, community_string: str, onu_index: str):
        self.host = host
        self.community = community_string
        self.onu_index = onu_index

    def execute(self, connection_manager=None, olt_version: str = None) -> Dict[str, Any]:
        async def _execute_async() -> Dict[str, Any]:
            oid = f"{self.OID_ONU_DEAUTHORIZE}.{self.onu_index}"

            snmp_engine = v3arch.SnmpEngine()
            auth = v3arch.CommunityData(self.community, mpModel=1)
            transport = await v3arch.UdpTransportTarget.create((self.host, 161))
            context = v3arch.ContextData()

            error_indication, error_status, error_index, var_binds = await v3arch.set_cmd(
                snmp_engine,
                auth,
                transport,
                context,
                v3arch.ObjectType(v3arch.ObjectIdentity(oid), Integer(1)),
            )

            if error_indication:
                return {"error": str(error_indication)}
            if error_status:
                error_status_text = error_status.prettyPrint() if hasattr(error_status, "prettyPrint") else str(error_status)
                error_msg = f"{error_status_text} at {error_index and var_binds[int(error_index) - 1][0] or '??'}"
                return {"error": error_msg}

            return {
                "onu_index": self.onu_index,
                "status": "success",
            }

        return asyncio.run(_execute_async())

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        pass
