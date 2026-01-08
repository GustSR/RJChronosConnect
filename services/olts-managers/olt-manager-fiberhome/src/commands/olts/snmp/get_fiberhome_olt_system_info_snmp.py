import asyncio
from typing import Any, Dict

from pysnmp.hlapi import v3arch

from ...base_command import OLTCommand


class GetFiberhomeOltSystemInfoSnmpCommand(OLTCommand):
    """Get basic system info via SNMP (Fiberhome AN5116)."""

    OID_SOFTWARE_VERSION = "1.3.6.1.4.1.5875.800.3.9.4.3"
    OID_FRAME_TYPE = "1.3.6.1.4.1.5875.800.3.9.1.1.2"
    OID_SYSTEM_TIME = "1.3.6.1.4.1.5875.800.3.9.4.22"

    def __init__(self, host: str, community_string: str):
        self.host = host
        self.community = community_string

    def execute(self, connection_manager=None, olt_version: str = None) -> Dict[str, Any]:
        async def _execute_async() -> Dict[str, Any]:
            snmp_engine = v3arch.SnmpEngine()
            auth = v3arch.CommunityData(self.community, mpModel=1)
            transport = await v3arch.UdpTransportTarget.create((self.host, 161))
            context = v3arch.ContextData()

            oids = [
                self.OID_SOFTWARE_VERSION,
                self.OID_FRAME_TYPE,
                self.OID_SYSTEM_TIME,
            ]

            error_indication, error_status, error_index, var_binds = await v3arch.get_cmd(
                snmp_engine,
                auth,
                transport,
                context,
                *[v3arch.ObjectType(v3arch.ObjectIdentity(oid)) for oid in oids],
            )

            if error_indication:
                return {"error": str(error_indication)}
            if error_status:
                error_status_text = error_status.prettyPrint() if hasattr(error_status, "prettyPrint") else str(error_status)
                error_msg = f"{error_status_text} at {error_index and var_binds[int(error_index) - 1][0] or '??'}"
                return {"error": error_msg}

            results = {}
            for oid, value in var_binds:
                oid_str = str(oid)
                if oid_str == self.OID_SOFTWARE_VERSION:
                    results["software_version"] = str(value)
                elif oid_str == self.OID_FRAME_TYPE:
                    results["frame_type"] = str(value)
                elif oid_str == self.OID_SYSTEM_TIME:
                    results["system_time"] = str(value)

            return results

        return asyncio.run(_execute_async())

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        pass
