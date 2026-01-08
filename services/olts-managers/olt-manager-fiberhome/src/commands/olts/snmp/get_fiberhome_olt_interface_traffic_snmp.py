import asyncio
from typing import Any, Dict, List

from pysnmp.hlapi import v3arch

from ...base_command import OLTCommand


class GetFiberhomeOltInterfaceTrafficSnmpCommand(OLTCommand):
    """Get interface traffic counters via SNMP (IF-MIB)."""

    OID_IF_DESCR = "1.3.6.1.2.1.2.2.1.2"
    OID_IF_IN_OCTETS = "1.3.6.1.2.1.2.2.1.10"
    OID_IF_OUT_OCTETS = "1.3.6.1.2.1.2.2.1.16"
    OID_IF_HC_IN_OCTETS = "1.3.6.1.2.1.31.1.1.1.6"
    OID_IF_HC_OUT_OCTETS = "1.3.6.1.2.1.31.1.1.1.10"

    def __init__(self, host: str, community_string: str):
        self.host = host
        self.community = community_string

    def execute(self, connection_manager=None, olt_version: str = None) -> List[Dict[str, Any]]:
        async def _execute_async() -> List[Dict[str, Any]]:
            snmp_engine = v3arch.SnmpEngine()
            auth = v3arch.CommunityData(self.community, mpModel=1)
            transport = await v3arch.UdpTransportTarget.create((self.host, 161))
            context = v3arch.ContextData()

            oids_to_walk = {
                "if_descr": self.OID_IF_DESCR,
                "in_octets": self.OID_IF_IN_OCTETS,
                "out_octets": self.OID_IF_OUT_OCTETS,
                "hc_in_octets": self.OID_IF_HC_IN_OCTETS,
                "hc_out_octets": self.OID_IF_HC_OUT_OCTETS,
            }

            data: Dict[str, Dict[str, Any]] = {}
            for key, base_oid in oids_to_walk.items():
                await self._walk_and_populate(
                    base_oid, key, data, snmp_engine, auth, transport, context
                )

            return list(data.values())

        return asyncio.run(_execute_async())

    async def _walk_and_populate(
        self,
        base_oid: str,
        key: str,
        data_dict: Dict[str, Dict[str, Any]],
        snmp_engine: v3arch.SnmpEngine,
        auth: v3arch.CommunityData,
        transport: v3arch.UdpTransportTarget,
        context: v3arch.ContextData,
    ) -> None:
        async for (
            error_indication,
            error_status,
            error_index,
            var_binds,
        ) in v3arch.walk_cmd(
            snmp_engine,
            auth,
            transport,
            context,
            v3arch.ObjectType(v3arch.ObjectIdentity(base_oid)),
            lexicographicMode=True,
        ):
            if error_indication or error_status:
                continue

            for oid, value in var_binds:
                oid_str = str(oid)
                if not oid_str.startswith(base_oid + "."):
                    continue
                index = oid_str[len(base_oid) + 1 :]
                entry = data_dict.setdefault(index, {"index": index})
                entry[key] = str(value)

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        pass
