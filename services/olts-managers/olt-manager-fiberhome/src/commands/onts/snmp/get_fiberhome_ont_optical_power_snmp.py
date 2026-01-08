import asyncio
from typing import Any, Dict, List

from pysnmp.hlapi import v3arch

from ...base_command import OLTCommand


class GetFiberhomeOntOpticalPowerSnmpCommand(OLTCommand):
    """Get ONU optical power via SNMP (Fiberhome onuPonInfoTable)."""

    OID_ONU_PON_RX_POWER = "1.3.6.1.4.1.5875.800.3.9.3.3.1.6"
    OID_ONU_PON_TX_POWER = "1.3.6.1.4.1.5875.800.3.9.3.3.1.7"
    OID_ONU_PON_POWER_VALID = "1.3.6.1.4.1.5875.800.3.9.3.3.1.11"

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
                "rx_power_raw": self.OID_ONU_PON_RX_POWER,
                "tx_power_raw": self.OID_ONU_PON_TX_POWER,
                "power_valid": self.OID_ONU_PON_POWER_VALID,
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
