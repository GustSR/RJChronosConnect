import asyncio
from typing import Any, Dict

from pysnmp.hlapi import v3arch

from ..base_command import OLTCommand


class GetOltSnmpInfoCommand(OLTCommand):
    """
    Command to get basic OLT system information via SNMP (SNMPv2-MIB).
    """

    OIDS = {
        "sys_descr": "1.3.6.1.2.1.1.1.0",
        "sys_object_id": "1.3.6.1.2.1.1.2.0",
        "sys_uptime": "1.3.6.1.2.1.1.3.0",
        "sys_name": "1.3.6.1.2.1.1.5.0",
    }

    def __init__(self, host: str, community_string: str):
        self.host = host
        self.community = community_string

    def execute(self, connection_manager=None, olt_version: str = None) -> Dict[str, Any]:
        """
        Executes SNMP GET to retrieve system information.
        """

        async def _execute_async() -> Dict[str, Any]:
            snmp_engine = v3arch.SnmpEngine()
            auth = v3arch.CommunityData(self.community, mpModel=1)
            transport = await v3arch.UdpTransportTarget.create((self.host, 161))
            context = v3arch.ContextData()

            object_types = [
                v3arch.ObjectType(v3arch.ObjectIdentity(oid))
                for oid in self.OIDS.values()
            ]

            error_indication, error_status, error_index, var_binds = await v3arch.get_cmd(
                snmp_engine,
                auth,
                transport,
                context,
                *object_types,
            )

            if error_indication:
                raise RuntimeError(f"SNMP error: {error_indication}")
            if error_status:
                error_text = error_status.prettyPrint() if hasattr(error_status, "prettyPrint") else str(error_status)
                error_location = var_binds[int(error_index) - 1][0] if error_index else "unknown"
                raise RuntimeError(f"SNMP error: {error_text} at {error_location}")

            results: Dict[str, Any] = {}
            oid_to_key = {v: k for k, v in self.OIDS.items()}
            for oid, value in var_binds:
                results[oid_to_key.get(str(oid), str(oid))] = value.prettyPrint()

            return results

        return asyncio.run(_execute_async())

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        # Not used for SNMP commands
        pass
