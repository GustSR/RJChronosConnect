import asyncio
from typing import Any, Dict, List, Optional

from pysnmp.hlapi import v3arch

from ..base_command import OLTCommand


class SnmpWalkCommand(OLTCommand):
    """
    Command to walk an arbitrary SNMP subtree for debugging/diagnostics.
    """

    def __init__(
        self,
        host: str,
        community_string: str,
        oid: str,
        contains: Optional[str] = None,
        limit: int = 200,
        timeout: int = 5,
        retries: int = 1,
    ):
        self.host = host
        self.community = community_string
        self.base_oid = oid.strip()
        self.contains = contains
        self.limit = limit
        self.timeout = timeout
        self.retries = retries
        self.base_oid_tuple = _oid_to_tuple(self.base_oid)

    def execute(self, connection_manager=None, olt_version: str = None) -> List[Dict[str, Any]]:
        async def _execute_async() -> List[Dict[str, Any]]:
            results: List[Dict[str, Any]] = []
            snmp_engine = v3arch.SnmpEngine()
            auth = v3arch.CommunityData(self.community, mpModel=1)
            transport = await v3arch.UdpTransportTarget.create(
                (self.host, 161),
                timeout=self.timeout,
                retries=self.retries,
            )
            context = v3arch.ContextData()

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
                v3arch.ObjectType(v3arch.ObjectIdentity(self.base_oid)),
                lexicographicMode=True,
            ):
                if error_indication:
                    raise RuntimeError(f"SNMP error: {error_indication}")
                if error_status:
                    error_text = (
                        error_status.prettyPrint()
                        if hasattr(error_status, "prettyPrint")
                        else str(error_status)
                    )
                    error_location = (
                        var_binds[int(error_index) - 1][0]
                        if error_index
                        else "unknown"
                    )
                    raise RuntimeError(f"SNMP error: {error_text} at {error_location}")

                for oid, value in var_binds:
                    oid_tuple = oid.asTuple()
                    if not _tuple_startswith(oid_tuple, self.base_oid_tuple):
                        return results

                    oid_str = _tuple_to_oid(oid_tuple)
                    value_str = value.prettyPrint()
                    value_hex, value_text = _decode_octets(value)

                    if self.contains and not _matches_filter(
                        self.contains, value_str, value_hex, value_text
                    ):
                        continue

                    results.append(
                        {
                            "oid": oid_str,
                            "value": value_str,
                            "value_hex": value_hex,
                            "value_text": value_text,
                        }
                    )

                    if len(results) >= self.limit:
                        return results

            return results

        return asyncio.run(_execute_async())

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        # Not used for SNMP commands
        pass


def _decode_octets(value) -> tuple[Optional[str], Optional[str]]:
    as_octets = getattr(value, "asOctets", None)
    if not callable(as_octets):
        return None, None

    raw = as_octets()
    value_hex = raw.hex().upper()
    if raw and all(32 <= b < 127 for b in raw):
        return value_hex, raw.decode("ascii", errors="ignore")
    return value_hex, None


def _oid_to_tuple(oid: str) -> tuple[int, ...]:
    return tuple(int(part) for part in oid.strip(".").split(".") if part)


def _tuple_to_oid(oid_tuple: tuple[int, ...]) -> str:
    return ".".join(str(part) for part in oid_tuple)


def _tuple_startswith(full: tuple[int, ...], prefix: tuple[int, ...]) -> bool:
    return full[: len(prefix)] == prefix


def _matches_filter(
    needle: str,
    value_str: str,
    value_hex: Optional[str],
    value_text: Optional[str],
) -> bool:
    if needle in value_str:
        return True
    if value_hex and needle in value_hex:
        return True
    if value_text and needle in value_text:
        return True
    return False
