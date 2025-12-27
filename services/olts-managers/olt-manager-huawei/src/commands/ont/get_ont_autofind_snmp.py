import asyncio
from typing import Any, Dict, List, Optional

from pysnmp.hlapi import v3arch

from ..base_command import OLTCommand
from ...core.parsers import snmp_converter


class GetOntAutofindSnmpCommand(OLTCommand):
    """
    Command to get ONTs in autofind (unauthorized) via SNMP.
    """

    OID_AUTOFIND_SERIAL = "1.3.6.1.4.1.2011.6.128.1.1.2.48.1.2"
    OID_AUTOFIND_TYPE = "1.3.6.1.4.1.2011.6.128.1.1.2.48.1.3"
    OID_AUTOFIND_STATE = "1.3.6.1.4.1.2011.6.128.1.1.2.48.1.4"
    OID_AUTOFIND_IFINDEX = "1.3.6.1.4.1.2011.6.128.1.1.2.48.1.5"
    OID_AUTOFIND_TIME = "1.3.6.1.4.1.2011.6.128.1.1.2.48.1.6"

    def __init__(
        self,
        host: str,
        community_string: str,
        serial_number: Optional[str] = None,
        olt_model: str = "MA5600T",
        limit: int = 200,
        timeout: int = 5,
        retries: int = 1,
    ):
        self.host = host
        self.community = community_string
        self.serial_number_filter = serial_number.upper() if serial_number else None
        self.olt_model = olt_model or "MA5600T"
        self.limit = limit
        self.timeout = timeout
        self.retries = retries

    def execute(self, connection_manager=None, olt_version: str = None) -> List[Dict[str, Any]]:
        async def _execute_async() -> List[Dict[str, Any]]:
            ont_data: Dict[str, Dict[str, Any]] = {}
            snmp_engine = v3arch.SnmpEngine()
            auth = v3arch.CommunityData(self.community, mpModel=1)
            transport = await v3arch.UdpTransportTarget.create(
                (self.host, 161),
                timeout=self.timeout,
                retries=self.retries,
            )
            context = v3arch.ContextData()

            oids_to_walk = {
                "serial_number": self.OID_AUTOFIND_SERIAL,
                "ont_type": self.OID_AUTOFIND_TYPE,
                "state": self.OID_AUTOFIND_STATE,
                "if_index": self.OID_AUTOFIND_IFINDEX,
                "autofind_time": self.OID_AUTOFIND_TIME,
            }

            for key, base_oid in oids_to_walk.items():
                await self._walk_and_populate(
                    base_oid, key, ont_data, snmp_engine, auth, transport, context
                )

            results = list(ont_data.values())

            for entry in results:
                if entry.get("if_index") is not None and not entry.get("port"):
                    entry["port"] = snmp_converter.convert_ifindex_to_port(
                        entry["if_index"], self.olt_model
                    )

            if self.serial_number_filter:
                results = [
                    ont
                    for ont in results
                    if str(ont.get("serial_number", "")).upper()
                    == self.serial_number_filter
                ]

            if self.limit:
                results = results[: self.limit]

            return results

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
        base_parts = base_oid.split(".")

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
                error_text = (
                    error_indication
                    if error_indication
                    else error_status.prettyPrint()
                    if hasattr(error_status, "prettyPrint")
                    else str(error_status)
                )
                print(f"[SNMP Error] Could not walk {base_oid}: {error_text}")
                break

            for oid, value in var_binds:
                oid_str = str(oid)
                if not oid_str.startswith(base_oid):
                    return

                index_parts = oid_str.split(".")[len(base_parts) :]
                if not index_parts:
                    continue

                index_key = ".".join(index_parts)
                entry = data_dict.setdefault(index_key, {"index": index_key})

                if entry.get("ont_id") is None:
                    entry["ont_id"] = _safe_int(index_parts[-1])
                if len(index_parts) >= 2 and entry.get("if_index") is None:
                    entry["if_index"] = _safe_int(index_parts[-2])

                if key == "serial_number":
                    entry[key] = _decode_serial_number(value)
                elif key == "if_index":
                    entry[key] = _safe_int(value.prettyPrint())
                elif key == "ont_type":
                    entry[key] = _decode_text(value)
                else:
                    entry[key] = value.prettyPrint()

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        # Not used for SNMP commands
        pass


def _safe_int(value: Any) -> Optional[int]:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _decode_text(value) -> str:
    as_octets = getattr(value, "asOctets", None)
    if not callable(as_octets):
        return value.prettyPrint()

    raw = as_octets()
    if raw and all(32 <= b < 127 for b in raw):
        return raw.decode("ascii", errors="ignore")
    return value.prettyPrint()


def _decode_serial_number(value) -> str:
    as_octets = getattr(value, "asOctets", None)
    if not callable(as_octets):
        return value.prettyPrint()

    raw = as_octets()
    if len(raw) >= 8:
        vendor = raw[:4].decode("ascii", errors="ignore")
        serial_hex = raw[4:8].hex().upper()
        return f"{vendor}{serial_hex}"

    if raw and all(32 <= b < 127 for b in raw):
        return raw.decode("ascii", errors="ignore")
    return raw.hex().upper()
