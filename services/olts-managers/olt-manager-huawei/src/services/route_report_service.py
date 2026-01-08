import asyncio
import re
from datetime import datetime, timezone
from io import BytesIO
from typing import Any, Dict, Iterable, List, Optional, Tuple
import xml.etree.ElementTree as ET

from pysnmp.hlapi import v3arch

from ..core.logging import get_logger
from ..core.parsers import snmp_converter
from ..schemas.report.route_report import RouteReport, RouteReportOnu, RouteReportSummary

logger = get_logger(__name__)


class RouteReportService:
    OID_LOS = "1.3.6.1.4.1.2011.6.128.1.1.2.50.1.4"
    OID_EQUIPMENT_SN = "1.3.6.1.4.1.2011.6.128.1.1.2.45.1.9"
    OID_ACTUAL_SN = "1.3.6.1.4.1.2011.6.128.1.1.2.46.1.30"
    OID_RX_POWER = "1.3.6.1.4.1.2011.6.128.1.1.2.51.1.4"
    OID_LAST_DOWN_TIME = "1.3.6.1.4.1.2011.6.128.1.1.2.46.1.23"
    OID_LAST_DOWN_CAUSE = "1.3.6.1.4.1.2011.6.128.1.1.2.46.1.24"
    OID_ONT_ONLINE_STATE = "1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9"

    OID_IFNAME = "1.3.6.1.2.1.31.1.1.1.1"
    OID_IFDESCR = "1.3.6.1.2.1.2.2.1.2"

    LAST_DOWN_CAUSE_MAP = {
        1: "los",
        2: "los",
        13: "dying-gasp",
    }

    def __init__(
        self,
        host: str,
        community_string: str,
        timeout: int = 5,
        retries: int = 1,
    ):
        self.host = host
        self.community = community_string
        self.timeout = timeout
        self.retries = retries

    def build_report(
        self,
        olt_id: int,
        if_index: Optional[int] = None,
        port: Optional[str] = None,
        los_threshold: int = 10,
    ) -> RouteReport:
        return asyncio.run(
            self._build_report_async(
                olt_id=olt_id,
                if_index=if_index,
                port=port,
                los_threshold=los_threshold,
            )
        )

    def list_gpon_ports(self) -> List[Dict[str, Any]]:
        return asyncio.run(self._list_gpon_ports_async())

    def export_xlsx(self, report: RouteReport) -> Tuple[bytes, str]:
        from openpyxl import Workbook

        workbook = Workbook()
        summary_sheet = workbook.active
        summary_sheet.title = "Resumo"
        summary_sheet.append(
            [
                "OLT",
                "SLOT",
                "PON",
                "ifIndex",
                "ONUs em LOS",
                "Classificacao",
                "Coletado em",
            ]
        )

        summary = report.summary
        summary_sheet.append(
            [
                summary.olt_id,
                summary.slot,
                summary.pon,
                summary.if_index,
                summary.los_count,
                summary.classification,
                summary.generated_at.isoformat(),
            ]
        )

        clients_sheet = workbook.create_sheet(title="Clientes")
        clients_sheet.append(
            [
                "Cliente",
                "Contrato",
                "SN Equipamento",
                "SN Atual",
                "SLOT",
                "PON",
                "ifIndex",
                "ontIndex",
                "Rx Power",
                "Last Down Time",
                "Last Down Cause",
            ]
        )

        for onu in report.onus:
            clients_sheet.append(
                [
                    onu.customer_name,
                    onu.contract,
                    onu.equipment_sn,
                    onu.actual_sn,
                    onu.slot,
                    onu.pon,
                    onu.if_index,
                    onu.ont_index,
                    onu.rx_power_dbm,
                    onu.last_down_time,
                    onu.last_down_cause,
                ]
            )

        buffer = BytesIO()
        workbook.save(buffer)
        buffer.seek(0)
        filename = self._build_filename(report.summary, "xlsx")
        return buffer.read(), filename

    def export_xml(self, report: RouteReport) -> Tuple[bytes, str]:
        summary = report.summary
        root = ET.Element(
            "routeReport",
            {
                "generatedAt": summary.generated_at.isoformat(),
                "olt": str(summary.olt_id),
            },
        )

        route = ET.SubElement(
            root,
            "route",
            {
                "slot": str(summary.slot) if summary.slot is not None else "",
                "pon": str(summary.pon) if summary.pon is not None else "",
                "ifIndex": str(summary.if_index),
                "losCount": str(summary.los_count),
                "classification": summary.classification,
            },
        )

        for onu in report.onus:
            onu_el = ET.SubElement(route, "onu")
            _set_text(onu_el, "customerName", onu.customer_name)
            _set_text(onu_el, "contract", onu.contract)
            _set_text(onu_el, "equipmentSn", onu.equipment_sn)
            _set_text(onu_el, "actualSn", onu.actual_sn)
            _set_text(onu_el, "slot", str(onu.slot) if onu.slot is not None else None)
            _set_text(onu_el, "pon", str(onu.pon) if onu.pon is not None else None)
            _set_text(onu_el, "ifIndex", str(onu.if_index))
            _set_text(onu_el, "ontIndex", str(onu.ont_index))
            _set_text(
                onu_el,
                "rxPower",
                f"{onu.rx_power_dbm:.2f}" if onu.rx_power_dbm is not None else None,
            )
            _set_text(onu_el, "lastDownTime", onu.last_down_time)
            _set_text(onu_el, "lastDownCause", onu.last_down_cause)

        buffer = BytesIO()
        tree = ET.ElementTree(root)
        tree.write(buffer, encoding="utf-8", xml_declaration=True)
        buffer.seek(0)
        filename = self._build_filename(report.summary, "xml")
        return buffer.read(), filename

    async def _build_report_async(
        self,
        olt_id: int,
        if_index: Optional[int],
        port: Optional[str],
        los_threshold: int,
    ) -> RouteReport:
        snmp_engine = v3arch.SnmpEngine()
        auth = v3arch.CommunityData(self.community, mpModel=1)
        transport = await v3arch.UdpTransportTarget.create(
            (self.host, 161),
            timeout=self.timeout,
            retries=self.retries,
        )
        context = v3arch.ContextData()

        if_name_map, port_to_ifindex = await self._build_ifindex_map(
            snmp_engine, auth, transport, context
        )

        resolved_if_index = if_index
        resolved_port = port
        if resolved_if_index is None:
            if resolved_port is None:
                raise ValueError("Informe if_index ou port")
            resolved_if_index = port_to_ifindex.get(resolved_port)
            if resolved_if_index is None:
                raise ValueError(f"Nao foi possivel resolver ifIndex para {resolved_port}")

        if resolved_port is None:
            if_name = if_name_map.get(resolved_if_index)
            resolved_port = _extract_port_from_ifname(if_name) if if_name else None
            if resolved_port is None:
                resolved_port = if_name

        slot, pon = _parse_slot_pon(resolved_port)

        los_keys = await self._collect_los_onus(
            snmp_engine, auth, transport, context, resolved_if_index
        )

        detail_maps = await self._collect_onu_details(
            snmp_engine, auth, transport, context, los_keys
        )

        onus = []
        for key in los_keys:
            if_index_val, ont_index = key
            onu = RouteReportOnu(
                equipment_sn=_decode_snmp_serial(detail_maps["equipment_sn"].get(key)),
                actual_sn=_decode_snmp_serial(detail_maps["actual_sn"].get(key)),
                rx_power_dbm=_convert_rx_power(detail_maps["rx_power"].get(key)),
                last_down_time=_stringify_value(detail_maps["last_down_time"].get(key)),
                last_down_cause=_map_last_down_cause(detail_maps["last_down_cause"].get(key)),
                if_index=if_index_val,
                ont_index=ont_index,
                port=resolved_port,
                slot=slot,
                pon=pon,
            )
            onus.append(onu)

        classification = _classify_route(len(onus), los_threshold)
        summary = RouteReportSummary(
            olt_id=olt_id,
            if_index=resolved_if_index,
            port=resolved_port,
            slot=slot,
            pon=pon,
            los_count=len(onus),
            classification=classification,
            generated_at=datetime.now(timezone.utc),
        )
        return RouteReport(summary=summary, onus=onus)

    async def _list_gpon_ports_async(self) -> List[Dict[str, Any]]:
        snmp_engine = v3arch.SnmpEngine()
        auth = v3arch.CommunityData(self.community, mpModel=1)
        transport = await v3arch.UdpTransportTarget.create(
            (self.host, 161),
            timeout=self.timeout,
            retries=self.retries,
        )
        context = v3arch.ContextData()

        if_name_map, _ = await self._build_ifindex_map(
            snmp_engine, auth, transport, context
        )

        ports: List[Dict[str, Any]] = []
        for if_index, if_name in if_name_map.items():
            port = _extract_port_from_ifname(if_name)
            if not port:
                continue
            frame, slot, pon = _parse_frame_slot_pon(port)
            ports.append(
                {
                    "if_index": if_index,
                    "if_name": if_name,
                    "port": port,
                    "frame": frame,
                    "slot": slot,
                    "pon": pon,
                }
            )

        ports.sort(
            key=lambda item: (
                item.get("frame") if item.get("frame") is not None else -1,
                item.get("slot") if item.get("slot") is not None else -1,
                item.get("pon") if item.get("pon") is not None else -1,
                item.get("if_index"),
            )
        )
        return ports

    async def _collect_los_onus(
        self,
        snmp_engine: v3arch.SnmpEngine,
        auth: v3arch.CommunityData,
        transport: v3arch.UdpTransportTarget,
        context: v3arch.ContextData,
        if_index: int,
    ) -> List[Tuple[int, int]]:
        entries = await self._walk_los_by_ifindex(
            snmp_engine, auth, transport, context, if_index
        )
        los_keys: List[Tuple[int, int]] = []
        value_counts = {1: 0, 2: 0}
        parsed_entries: List[Tuple[Tuple[int, int], int]] = []

        for (if_idx, ont_idx), value in entries.items():
            if if_idx != if_index:
                continue
            try:
                los_state = int(value)
            except (TypeError, ValueError):
                continue
            if los_state in value_counts:
                value_counts[los_state] += 1
            parsed_entries.append(((if_idx, ont_idx), los_state))

        if parsed_entries:
            alarm_value = 2 if value_counts[1] >= value_counts[2] else 1
            for key, los_state in parsed_entries:
                if los_state == alarm_value:
                    los_keys.append(key)
        if not los_keys:
            return los_keys

        online_states = await self._get_indexed_values(
            snmp_engine,
            auth,
            transport,
            context,
            self.OID_ONT_ONLINE_STATE,
            set(los_keys),
        )
        if not online_states:
            return los_keys

        filtered_keys = []
        for key in los_keys:
            state = _parse_online_state(online_states.get(key))
            if state == "online":
                continue
            filtered_keys.append(key)
        if not filtered_keys:
            return filtered_keys

        last_down_causes = await self._get_indexed_values(
            snmp_engine,
            auth,
            transport,
            context,
            self.OID_LAST_DOWN_CAUSE,
            set(filtered_keys),
        )

        los_filtered = []
        for key in filtered_keys:
            value = last_down_causes.get(key)
            if value is None:
                los_filtered.append(key)
                continue
            try:
                cause_code = int(value)
            except (TypeError, ValueError):
                los_filtered.append(key)
                continue
            if cause_code == 2:
                los_filtered.append(key)

        return los_filtered

    async def _collect_onu_details(
        self,
        snmp_engine: v3arch.SnmpEngine,
        auth: v3arch.CommunityData,
        transport: v3arch.UdpTransportTarget,
        context: v3arch.ContextData,
        keys: Iterable[Tuple[int, int]],
    ) -> Dict[str, Dict[Tuple[int, int], Any]]:
        key_set = set(keys)
        tables = {
            "equipment_sn": self.OID_EQUIPMENT_SN,
            "actual_sn": self.OID_ACTUAL_SN,
            "rx_power": self.OID_RX_POWER,
            "last_down_time": self.OID_LAST_DOWN_TIME,
            "last_down_cause": self.OID_LAST_DOWN_CAUSE,
        }

        results: Dict[str, Dict[Tuple[int, int], Any]] = {}
        for name, oid in tables.items():
            results[name] = await self._get_indexed_values(
                snmp_engine,
                auth,
                transport,
                context,
                oid,
                key_set,
            )
        return results

    async def _build_ifindex_map(
        self,
        snmp_engine: v3arch.SnmpEngine,
        auth: v3arch.CommunityData,
        transport: v3arch.UdpTransportTarget,
        context: v3arch.ContextData,
    ) -> Tuple[Dict[int, str], Dict[str, int]]:
        if_name_entries = await self._walk_simple_table(
            snmp_engine, auth, transport, context, self.OID_IFNAME
        )
        if not if_name_entries:
            if_name_entries = await self._walk_simple_table(
                snmp_engine, auth, transport, context, self.OID_IFDESCR
            )

        if_index_to_name: Dict[int, str] = {}
        port_to_ifindex: Dict[str, int] = {}

        for if_index, name in if_name_entries.items():
            if not name:
                continue
            if "gpon" not in name.lower():
                continue
            if_index_to_name[if_index] = name
            port = _extract_port_from_ifname(name)
            if port:
                port_to_ifindex[port] = if_index

        return if_index_to_name, port_to_ifindex

    async def _walk_indexed_table(
        self,
        snmp_engine: v3arch.SnmpEngine,
        auth: v3arch.CommunityData,
        transport: v3arch.UdpTransportTarget,
        context: v3arch.ContextData,
        base_oid: str,
        filter_keys: Optional[Iterable[Tuple[int, int]]] = None,
    ) -> Dict[Tuple[int, int], Any]:
        results: Dict[Tuple[int, int], Any] = {}
        base_oid_tuple = _oid_to_tuple(base_oid)
        filter_set = set(filter_keys) if filter_keys else None

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
            if error_indication:
                raise RuntimeError(f"SNMP error: {error_indication}")
            if error_status:
                error_text = (
                    error_status.prettyPrint()
                    if hasattr(error_status, "prettyPrint")
                    else str(error_status)
                )
                error_location = (
                    var_binds[int(error_index) - 1][0] if error_index else "unknown"
                )
                raise RuntimeError(f"SNMP error: {error_text} at {error_location}")

            for oid, value in var_binds:
                oid_tuple = oid.asTuple()
                if not _tuple_startswith(oid_tuple, base_oid_tuple):
                    return results

                index_tuple = oid_tuple[len(base_oid_tuple) :]
                if len(index_tuple) < 2:
                    continue

                if_index, ont_index = int(index_tuple[0]), int(index_tuple[1])
                key = (if_index, ont_index)
                if filter_set is not None and key not in filter_set:
                    continue
                results[key] = value

        return results

    async def _walk_los_by_ifindex(
        self,
        snmp_engine: v3arch.SnmpEngine,
        auth: v3arch.CommunityData,
        transport: v3arch.UdpTransportTarget,
        context: v3arch.ContextData,
        if_index: int,
    ) -> Dict[Tuple[int, int], Any]:
        results: Dict[Tuple[int, int], Any] = {}
        base_oid = f"{self.OID_LOS}.{if_index}"
        base_oid_tuple = _oid_to_tuple(base_oid)

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
            if error_indication:
                raise RuntimeError(f"SNMP error: {error_indication}")
            if error_status:
                error_text = (
                    error_status.prettyPrint()
                    if hasattr(error_status, "prettyPrint")
                    else str(error_status)
                )
                error_location = (
                    var_binds[int(error_index) - 1][0] if error_index else "unknown"
                )
                raise RuntimeError(f"SNMP error: {error_text} at {error_location}")

            for oid, value in var_binds:
                oid_tuple = oid.asTuple()
                if not _tuple_startswith(oid_tuple, base_oid_tuple):
                    return results

                index_tuple = oid_tuple[len(base_oid_tuple) :]
                if len(index_tuple) < 1:
                    continue

                ont_index = int(index_tuple[0])
                results[(if_index, ont_index)] = value

        return results

    async def _get_indexed_values(
        self,
        snmp_engine: v3arch.SnmpEngine,
        auth: v3arch.CommunityData,
        transport: v3arch.UdpTransportTarget,
        context: v3arch.ContextData,
        base_oid: str,
        keys: Iterable[Tuple[int, int]],
    ) -> Dict[Tuple[int, int], Any]:
        results: Dict[Tuple[int, int], Any] = {}
        base_oid_tuple = _oid_to_tuple(base_oid)
        key_list = list(keys)
        if not key_list:
            return results

        for batch in _chunked(key_list, 20):
            objects = [
                v3arch.ObjectType(
                    v3arch.ObjectIdentity(
                        f"{base_oid}.{if_index}.{ont_index}"
                    )
                )
                for if_index, ont_index in batch
            ]

            error_indication, error_status, error_index, var_binds = (
                await v3arch.get_cmd(
                    snmp_engine, auth, transport, context, *objects
                )
            )

            if error_indication:
                raise RuntimeError(f"SNMP error: {error_indication}")
            if error_status:
                error_text = (
                    error_status.prettyPrint()
                    if hasattr(error_status, "prettyPrint")
                    else str(error_status)
                )
                error_location = (
                    var_binds[int(error_index) - 1][0] if error_index else "unknown"
                )
                raise RuntimeError(f"SNMP error: {error_text} at {error_location}")

            for oid, value in var_binds:
                oid_tuple = oid.asTuple()
                if not _tuple_startswith(oid_tuple, base_oid_tuple):
                    continue

                index_tuple = oid_tuple[len(base_oid_tuple) :]
                if len(index_tuple) < 2:
                    continue

                if_index = int(index_tuple[0])
                ont_index = int(index_tuple[1])
                if _is_no_such(value):
                    continue
                results[(if_index, ont_index)] = value

        return results

    async def _walk_simple_table(
        self,
        snmp_engine: v3arch.SnmpEngine,
        auth: v3arch.CommunityData,
        transport: v3arch.UdpTransportTarget,
        context: v3arch.ContextData,
        base_oid: str,
    ) -> Dict[int, str]:
        results: Dict[int, str] = {}
        base_oid_tuple = _oid_to_tuple(base_oid)

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
            if error_indication:
                raise RuntimeError(f"SNMP error: {error_indication}")
            if error_status:
                error_text = (
                    error_status.prettyPrint()
                    if hasattr(error_status, "prettyPrint")
                    else str(error_status)
                )
                error_location = (
                    var_binds[int(error_index) - 1][0] if error_index else "unknown"
                )
                raise RuntimeError(f"SNMP error: {error_text} at {error_location}")

            for oid, value in var_binds:
                oid_tuple = oid.asTuple()
                if not _tuple_startswith(oid_tuple, base_oid_tuple):
                    return results

                index_tuple = oid_tuple[len(base_oid_tuple) :]
                if len(index_tuple) != 1:
                    continue
                if_index = int(index_tuple[0])
                results[if_index] = value.prettyPrint()

        return results

    def _build_filename(self, summary: RouteReportSummary, extension: str) -> str:
        timestamp = summary.generated_at.astimezone(timezone.utc).strftime(
            "%Y%m%d-%H%M%S"
        )
        return f"route-report-olt-{summary.olt_id}-ifindex-{summary.if_index}-{timestamp}.{extension}"


def _extract_port_from_ifname(name: str) -> Optional[str]:
    match = re.search(r"(\d+/\d+/\d+)", name)
    if match:
        return match.group(1)
    return None


def _parse_slot_pon(port: Optional[str]) -> Tuple[Optional[int], Optional[int]]:
    if not port:
        return None, None
    parts = port.split("/")
    if len(parts) != 3:
        return None, None
    try:
        _, slot, pon = (int(part) for part in parts)
    except ValueError:
        return None, None
    return slot, pon


def _parse_frame_slot_pon(
    port: Optional[str],
) -> Tuple[Optional[int], Optional[int], Optional[int]]:
    if not port:
        return None, None, None
    parts = port.split("/")
    if len(parts) != 3:
        return None, None, None
    try:
        frame, slot, pon = (int(part) for part in parts)
    except ValueError:
        return None, None, None
    return frame, slot, pon


def _parse_online_state(value: Any) -> Optional[str]:
    if value is None:
        return None
    try:
        numeric = int(value)
        return {1: "online", 2: "offline"}.get(numeric)
    except (TypeError, ValueError):
        text = value.prettyPrint() if hasattr(value, "prettyPrint") else str(value)
        lower = text.strip().lower()
        if not lower or lower == "-1":
            return None
        if "online" in lower:
            return "online"
        if "offline" in lower:
            return "offline"
        return None


def _is_no_such(value: Any) -> bool:
    if value is None:
        return True
    text = value.prettyPrint() if hasattr(value, "prettyPrint") else str(value)
    return text.strip().lower().startswith("no such")


def _chunked(items: List[Any], size: int) -> List[List[Any]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def _decode_snmp_serial(value: Any) -> Optional[str]:
    if value is None:
        return None
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


def _stringify_value(value: Any) -> Optional[str]:
    if value is None:
        return None
    return value.prettyPrint() if hasattr(value, "prettyPrint") else str(value)


def _convert_rx_power(value: Any) -> Optional[float]:
    if value is None:
        return None
    return snmp_converter.convert_optical_power(value, scaling_factor=100.0)


def _map_last_down_cause(value: Any) -> Optional[str]:
    if value is None:
        return None
    try:
        cause_code = int(value)
    except (TypeError, ValueError):
        return _stringify_value(value)
    return RouteReportService.LAST_DOWN_CAUSE_MAP.get(cause_code, str(cause_code))


def _classify_route(los_count: int, threshold: int) -> str:
    if los_count >= threshold:
        return "route-down"
    if los_count > 0:
        return "partial"
    return "normal"


def _set_text(element: ET.Element, tag: str, value: Optional[str]) -> None:
    child = ET.SubElement(element, tag)
    if value is not None:
        child.text = value


def _oid_to_tuple(oid: str) -> Tuple[int, ...]:
    return tuple(int(part) for part in oid.strip(".").split(".") if part)


def _tuple_startswith(full: Tuple[int, ...], prefix: Tuple[int, ...]) -> bool:
    return full[: len(prefix)] == prefix
