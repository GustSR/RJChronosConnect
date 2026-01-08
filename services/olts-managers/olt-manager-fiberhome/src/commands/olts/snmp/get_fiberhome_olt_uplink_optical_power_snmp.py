import asyncio
from typing import Any, Dict

from pysnmp.hlapi import v3arch

from ...base_command import OLTCommand


class GetFiberhomeOltUplinkOpticalPowerSnmpCommand(OLTCommand):
    """Get uplink optical TX/RX power via SNMP (Fiberhome AN5116)."""

    OID_UPLINK_TX_POWER = "1.3.6.1.4.1.5875.800.3.9.3.5.1.7"
    OID_UPLINK_RX_POWER = "1.3.6.1.4.1.5875.800.3.9.3.5.1.8"

    def __init__(self, host: str, community_string: str, port_index: str):
        self.host = host
        self.community = community_string
        self.port_index = port_index

    def execute(self, connection_manager=None, olt_version: str = None) -> Dict[str, Any]:
        async def _execute_async() -> Dict[str, Any]:
            oid_tx = f"{self.OID_UPLINK_TX_POWER}.{self.port_index}"
            oid_rx = f"{self.OID_UPLINK_RX_POWER}.{self.port_index}"

            snmp_engine = v3arch.SnmpEngine()
            auth = v3arch.CommunityData(self.community, mpModel=1)
            transport = await v3arch.UdpTransportTarget.create((self.host, 161))
            context = v3arch.ContextData()

            error_indication, error_status, error_index, var_binds = await v3arch.get_cmd(
                snmp_engine,
                auth,
                transport,
                context,
                v3arch.ObjectType(v3arch.ObjectIdentity(oid_tx)),
                v3arch.ObjectType(v3arch.ObjectIdentity(oid_rx)),
            )

            if error_indication:
                return {"error": str(error_indication)}
            if error_status:
                error_status_text = error_status.prettyPrint() if hasattr(error_status, "prettyPrint") else str(error_status)
                error_msg = f"{error_status_text} at {error_index and var_binds[int(error_index) - 1][0] or '??'}"
                return {"error": error_msg}

            results = {"port_index": self.port_index}
            for oid, value in var_binds:
                oid_str = str(oid)
                if oid_str.startswith(self.OID_UPLINK_TX_POWER):
                    results["tx_power_centi_dbm"] = int(value)
                    results["tx_power_dbm"] = round(int(value) / 100.0, 2)
                elif oid_str.startswith(self.OID_UPLINK_RX_POWER):
                    results["rx_power_centi_dbm"] = int(value)
                    results["rx_power_dbm"] = round(int(value) / 100.0, 2)

            return results

        return asyncio.run(_execute_async())

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        pass
