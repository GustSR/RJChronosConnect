import asyncio
from typing import Any, Dict

from pysnmp.hlapi import v3arch

from ...base_command import OLTCommand


class GetFiberhomeOltPowerConsumptionSnmpCommand(OLTCommand):
    """Get power consumption via SNMP (Fiberhome AN5116)."""

    OID_POWER_CONSUMPTION = "1.3.6.1.4.1.5875.800.3.9.4.25"

    def __init__(self, host: str, community_string: str):
        self.host = host
        self.community = community_string

    def execute(self, connection_manager=None, olt_version: str = None) -> Dict[str, Any]:
        async def _execute_async() -> Dict[str, Any]:
            snmp_engine = v3arch.SnmpEngine()
            auth = v3arch.CommunityData(self.community, mpModel=1)
            transport = await v3arch.UdpTransportTarget.create((self.host, 161))
            context = v3arch.ContextData()

            error_indication, error_status, error_index, var_binds = await v3arch.get_cmd(
                snmp_engine,
                auth,
                transport,
                context,
                v3arch.ObjectType(v3arch.ObjectIdentity(self.OID_POWER_CONSUMPTION)),
            )

            if error_indication:
                return {"error": str(error_indication)}
            if error_status:
                error_status_text = error_status.prettyPrint() if hasattr(error_status, "prettyPrint") else str(error_status)
                error_msg = f"{error_status_text} at {error_index and var_binds[int(error_index) - 1][0] or '??'}"
                return {"error": error_msg}

            raw_value = var_binds[0][1]
            try:
                power_raw = int(raw_value)
            except (ValueError, TypeError):
                power_raw = None

            power_watts = None
            if power_raw is not None:
                power_watts = round(power_raw / 100.0, 2)

            return {
                "power_centiwatts": power_raw,
                "power_watts": power_watts,
                "raw_value": str(raw_value),
            }

        return asyncio.run(_execute_async())

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        pass
