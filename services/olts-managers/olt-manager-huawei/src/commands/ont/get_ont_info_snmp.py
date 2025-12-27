import asyncio
from typing import Any, Dict, List, Optional

from pysnmp.hlapi import v3arch

from ..base_command import OLTCommand


class GetOntInfoSnmpCommand(OLTCommand):
    """
    Command to get detailed ONT information via SNMP WALK.
    This command walks multiple OID tables to collect and correlate data about ONTs.
    """

    # OIDs from HUAWEI-GPON-MIB
    OID_ONT_SERIAL_NUMBER = "1.3.6.1.4.1.2011.6.128.1.1.2.43.1.3"  # hwGponOntSerialNum (MA5800)
    OID_ONT_ONLINE_STATE = (
        "1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9"  # hwGponDeviceOntOnlineState
    )
    OID_ONT_DESCRIPTION = "1.3.6.1.4.1.2011.6.128.1.1.2.43.1.5"  # hwGponOntDescription
    OID_ONT_LAST_DOWN_CAUSE = (
        "1.3.6.1.4.1.2011.6.128.1.1.2.43.1.14"  # hwGponOntLastDownCause
    )
    OID_ONT_DISTANCE = (
        "1.3.6.1.4.1.2011.6.128.1.1.2.46.1.20"  # hwGponDeviceOntControlRanging
    )

    def __init__(
        self,
        host: str,
        community_string: str,
        port: Optional[str] = None,
        serial_number: Optional[str] = None,
    ):
        self.host = host
        self.community = community_string
        self.port_str = port
        self.serial_number_filter = serial_number

    def execute(
        self, connection_manager=None, olt_version: str = None
    ) -> List[Dict[str, Any]]:
        """
        Executes the SNMP WALK across multiple tables and correlates the results.
        """

        async def _execute_async() -> List[Dict[str, Any]]:
            ont_data = {}
            snmp_engine = v3arch.SnmpEngine()
            auth = v3arch.CommunityData(self.community, mpModel=1)
            transport = await v3arch.UdpTransportTarget.create((self.host, 161))
            context = v3arch.ContextData()

            # List of OIDs to walk. We process them sequentially.
            oids_to_walk = {
                "serial_number": self.OID_ONT_SERIAL_NUMBER,
                "online_state": self.OID_ONT_ONLINE_STATE,
                "description": self.OID_ONT_DESCRIPTION,
                "last_down_cause": self.OID_ONT_LAST_DOWN_CAUSE,
                "distance_m": self.OID_ONT_DISTANCE,
            }

            for key, base_oid in oids_to_walk.items():
                await self._walk_and_populate(
                    base_oid, key, ont_data, snmp_engine, auth, transport, context
                )

            # Convert the correlated dictionary to a list
            result_list = list(ont_data.values())

            # Apply filters if provided
            if self.serial_number_filter:
                serial_filter = self.serial_number_filter.upper()
                return [
                    ont
                    for ont in result_list
                    if str(ont.get("serial_number", "")).upper() == serial_filter
                ]

            if self.port_str:
                return [ont for ont in result_list if ont.get("port") == self.port_str]

            return result_list

        return asyncio.run(_execute_async())

    async def _walk_and_populate(
        self,
        base_oid: str,
        key: str,
        data_dict: Dict[str, Dict],
        snmp_engine: v3arch.SnmpEngine,
        auth: v3arch.CommunityData,
        transport: v3arch.UdpTransportTarget,
        context: v3arch.ContextData,
    ) -> None:
        """Walks a single OID tree and populates the data dictionary."""
        state_map = {1: "online", 2: "offline"}
        cause_map = {
            0: "unknown",
            1: "dying-gasp",
            2: "loss-of-signal",
            3: "loss-of-frame",
            4: "shutdown",
        }

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
                # Log error but continue to try other OIDs
                error_text = (
                    error_indication
                    if error_indication
                    else error_status.prettyPrint()
                    if hasattr(error_status, "prettyPrint")
                    else str(error_status)
                )
                print(f"[SNMP Error] Could not walk {base_oid}: {error_text}")
                break

            for var_bind in var_binds:
                oid, value = var_bind
                oid_str = str(oid)

                if not oid_str.startswith(base_oid):
                    return

                try:
                    # The index is typically composed of ifIndex and ontId
                    oid_parts = oid_str.split(".")
                    if_index = int(oid_parts[-2])
                    ont_id = int(oid_parts[-1])
                    unique_key = f"{if_index}.{ont_id}"

                    if unique_key not in data_dict:
                        data_dict[unique_key] = {
                            "if_index": if_index,
                            "ont_id": ont_id,
                            "port": self._ifindex_to_port(if_index),
                        }

                    # Populate the specific key for this OID
                    if key == "serial_number":
                        data_dict[unique_key][key] = _decode_serial_number(value)
                    elif key == "online_state":
                        data_dict[unique_key][key] = state_map.get(
                            int(value), "unknown"
                        )
                    elif key == "last_down_cause":
                        data_dict[unique_key][key] = cause_map.get(
                            int(value), "unknown"
                        )
                    else:
                        data_dict[unique_key][key] = value.prettyPrint()

                except (IndexError, ValueError):
                    continue

    def _ifindex_to_port(self, if_index: int) -> str:
        """Converts a proprietary ifIndex back to a frame/slot/port string."""
        base_index = 4194304000
        slot_multiplier = 8192
        pon_multiplier = 256

        # This is the reverse of the calculation in other commands
        temp = if_index - base_index
        slot = temp // slot_multiplier
        temp %= slot_multiplier
        pon_port = temp // pon_multiplier

        # Frame is assumed to be 0 for many models
        return f"0/{slot}/{pon_port}"

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        # Not used for SNMP commands
        pass


def _decode_serial_number(value) -> str:
    as_octets = getattr(value, "asOctets", None)
    if not callable(as_octets):
        return value.prettyPrint()

    raw = as_octets()
    if len(raw) >= 8:
        vendor = raw[:4].decode("ascii", errors="ignore")
        serial_hex = raw[4:8].hex().upper()
        return f"{vendor}{serial_hex}"

    # Fallbacks for unexpected length/format
    if raw and all(32 <= b < 127 for b in raw):
        return raw.decode("ascii", errors="ignore")
    return raw.hex().upper()
