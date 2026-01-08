import asyncio
import re
from typing import Any, Dict, List, Optional

from pysnmp.hlapi import v3arch

from ...base_command import OLTCommand


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

            await self._fill_online_state(
                ont_data, snmp_engine, auth, transport, context
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
                        normalized_state, description_override = _normalize_online_state(
                            value
                        )
                        if normalized_state:
                            data_dict[unique_key][key] = normalized_state
                        else:
                            data_dict[unique_key][key] = None
                        if description_override and _should_override_description(
                            data_dict[unique_key].get("description")
                        ):
                            data_dict[unique_key]["description"] = description_override
                    elif key == "last_down_cause":
                        data_dict[unique_key][key] = cause_map.get(
                            int(value), "unknown"
                        )
                    elif key == "description":
                        description_value = value.prettyPrint()
                        current_description = data_dict[unique_key].get("description")
                        if _should_override_description(description_value):
                            if _should_override_description(current_description):
                                data_dict[unique_key][key] = None
                        else:
                            data_dict[unique_key][key] = description_value
                    else:
                        data_dict[unique_key][key] = value.prettyPrint()

                except (IndexError, ValueError):
                    continue

    async def _fill_online_state(
        self,
        data_dict: Dict[str, Dict],
        snmp_engine: v3arch.SnmpEngine,
        auth: v3arch.CommunityData,
        transport: v3arch.UdpTransportTarget,
        context: v3arch.ContextData,
    ) -> None:
        """Fetches ONT online state using SNMP GET for missing entries."""
        pending = [
            (ont.get("if_index"), ont.get("ont_id"), ont.get("port"))
            for ont in data_dict.values()
            if ont.get("online_state") is None
            and ont.get("if_index") is not None
            and ont.get("ont_id") is not None
        ]
        if not pending:
            return

        lookup = {
            (ont.get("if_index"), ont.get("ont_id")): ont
            for ont in data_dict.values()
            if ont.get("if_index") is not None and ont.get("ont_id") is not None
        }

        remaining = set()

        for batch in _chunked(pending, 20):
            objects = [
                v3arch.ObjectType(
                    v3arch.ObjectIdentity(
                        f"{self.OID_ONT_ONLINE_STATE}.{if_index}.{ont_id}"
                    )
                )
                for if_index, ont_id, _ in batch
            ]

            error_indication, error_status, error_index, var_binds = (
                await v3arch.get_cmd(
                    snmp_engine, auth, transport, context, *objects
                )
            )

            if error_indication or error_status:
                for if_index, ont_id, _ in batch:
                    remaining.add((if_index, ont_id))
                continue

            for oid, value in var_binds:
                oid_parts = str(oid).split(".")
                if len(oid_parts) < 2:
                    continue
                try:
                    if_index = int(oid_parts[-2])
                    ont_id = int(oid_parts[-1])
                except ValueError:
                    continue

                ont = lookup.get((if_index, ont_id))
                if not ont:
                    continue

                if _is_no_such(value):
                    remaining.add((if_index, ont_id))
                    continue

                normalized_state, description_override = _normalize_online_state(value)
                if normalized_state:
                    ont["online_state"] = normalized_state
                else:
                    ont["online_state"] = None
                if description_override and _should_override_description(
                    ont.get("description")
                ):
                    ont["description"] = description_override

        if not remaining:
            return

        fallback_targets = []
        fallback_lookup = {}
        for if_index, ont_id, port in pending:
            if (if_index, ont_id) not in remaining:
                continue
            ont_index = _calculate_ont_index(port, ont_id)
            if ont_index is None:
                continue
            fallback_targets.append((ont_index, if_index, ont_id))
            fallback_lookup[(if_index, ont_id)] = ont_index

        if not fallback_targets:
            return

        for batch in _chunked(fallback_targets, 20):
            objects = [
                v3arch.ObjectType(
                    v3arch.ObjectIdentity(
                        f"{self.OID_ONT_ONLINE_STATE}.{ont_index}"
                    )
                )
                for ont_index, _, _ in batch
            ]

            error_indication, error_status, error_index, var_binds = (
                await v3arch.get_cmd(
                    snmp_engine, auth, transport, context, *objects
                )
            )

            if error_indication or error_status:
                continue

            for oid, value in var_binds:
                oid_parts = str(oid).split(".")
                if not oid_parts:
                    continue
                try:
                    ont_index = int(oid_parts[-1])
                except ValueError:
                    continue

                if _is_no_such(value):
                    continue

                match = next(
                    (
                        key
                        for key, idx in fallback_lookup.items()
                        if idx == ont_index
                    ),
                    None,
                )
                if not match:
                    continue

                ont = lookup.get(match)
                if not ont:
                    continue

                normalized_state, description_override = _normalize_online_state(value)
                if normalized_state:
                    ont["online_state"] = normalized_state
                else:
                    ont["online_state"] = None
                if description_override and _should_override_description(
                    ont.get("description")
                ):
                    ont["description"] = description_override

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


def _normalize_online_state(value: Any) -> tuple[Optional[str], Optional[str]]:
    if value is None:
        return None, None

    try:
        numeric = int(value)
        return {1: "online", 2: "offline"}.get(numeric, "unknown"), None
    except (TypeError, ValueError):
        text = value.prettyPrint() if hasattr(value, "prettyPrint") else str(value)
        lower = text.strip().lower()
        if not lower or lower == "-1":
            return None, None

        state = None
        if "online" in lower:
            state = "online"
        elif "offline" in lower:
            state = "offline"
        elif "authd" in lower:
            state = "online"
        elif "unauth" in lower or "unauthorized" in lower:
            state = "offline"

        description_hint = _extract_description_hint(text)
        if state:
            if lower not in {"online", "offline", "authd", "unauth", "unauthorized"}:
                return state, description_hint
            return state, None

        return None, description_hint


def _extract_description_hint(text: str) -> Optional[str]:
    raw = text.strip()
    if not raw or raw == "-1":
        return None

    lower = raw.lower()
    match = re.search(r"(?:^|[_\\s])descr(?:[_\\s]+)", lower)
    if not match:
        return None

    raw = raw[match.end() :]

    lower = raw.lower()
    for marker in ("_authd", "_unauth", " authd", " unauth"):
        idx = lower.find(marker)
        if idx != -1:
            raw = raw[:idx]
            break

    raw = raw.strip(" _")
    return raw or None


def _should_override_description(current: Optional[str]) -> bool:
    if current is None:
        return True
    return str(current).strip() in {"", "-1"}


def _calculate_ont_index(port: str, ont_id: int) -> Optional[int]:
    if not port:
        return None
    try:
        frame, slot, pon = map(int, port.split("/"))
    except (ValueError, AttributeError):
        return None
    return (frame * 1000000) + (slot * 10000) + (pon * 100) + int(ont_id)


def _is_no_such(value: Any) -> bool:
    if value is None:
        return True
    text = value.prettyPrint() if hasattr(value, "prettyPrint") else str(value)
    return text.lower().startswith("no such")


def _chunked(items: List[Any], size: int) -> List[List[Any]]:
    return [items[i : i + size] for i in range(0, len(items), size)]

    # Fallbacks for unexpected length/format
    if raw and all(32 <= b < 127 for b in raw):
        return raw.decode("ascii", errors="ignore")
    return raw.hex().upper()
