from typing import Optional

from fastapi import APIRouter, Query

from ..schemas import VlanCreateRequest
from ..services import olt_service

router = APIRouter(prefix="/api/v1", tags=["OLT"])

OLT_COMMANDS = {
    "snmp": [
        {
            "id": "get_olt_system_info",
            "command": "GetFiberhomeOltSystemInfoSnmpCommand",
            "summary": "Get basic system info via SNMP",
        },
        {
            "id": "get_olt_auth_onu_count",
            "command": "GetFiberhomeOltAuthOnuCountSnmpCommand",
            "summary": "Get authenticated ONU count via SNMP",
        },
        {
            "id": "get_olt_power_consumption",
            "command": "GetFiberhomeOltPowerConsumptionSnmpCommand",
            "summary": "Get OLT power consumption via SNMP",
        },
        {
            "id": "get_olt_uplink_optical_power",
            "command": "GetFiberhomeOltUplinkOpticalPowerSnmpCommand",
            "summary": "Get uplink optical power via SNMP",
        },
        {
            "id": "get_olt_interface_traffic",
            "command": "GetFiberhomeOltInterfaceTrafficSnmpCommand",
            "summary": "Get interface traffic via SNMP",
        },
    ],
    "ssh": [
        {
            "id": "get_olt_port_status",
            "command": "GetFiberhomePortStatusCliCommand",
            "summary": "Get PON port status via CLI",
        },
        {
            "id": "get_olt_slot_status",
            "command": "GetFiberhomeSlotStatusCliCommand",
            "summary": "Get slot status via CLI",
        },
        {
            "id": "get_olt_card_status",
            "command": "GetFiberhomeCardStatusCliCommand",
            "summary": "Get card status via CLI",
        },
        {
            "id": "get_olt_version",
            "command": "GetFiberhomeVersionCliCommand",
            "summary": "Get OLT version via CLI",
        },
        {
            "id": "get_olt_ipinfo",
            "command": "GetFiberhomeIpInfoCliCommand",
            "summary": "Get IP information via CLI",
        },
        {
            "id": "create_vlan",
            "command": "CreateFiberhomeVlanCliCommand",
            "summary": "Create VLAN via CLI",
        },
        {
            "id": "delete_vlan",
            "command": "DeleteFiberhomeVlanCliCommand",
            "summary": "Delete VLAN via CLI",
        },
        {
            "id": "list_vlans",
            "command": "ListFiberhomeVlansCliCommand",
            "summary": "List VLANs via CLI",
        },
    ],
}


@router.get("/olts/commands", summary="List OLT commands")
def list_olt_commands():
    return {
        "service": "olt-manager-fiberhome",
        "domain": "olt",
        "commands": OLT_COMMANDS,
    }


@router.get("/olts/{olt_id}/system-info", summary="Get OLT system info via SNMP")
def get_system_info(olt_id: int):
    return olt_service.get_olt_system_info(olt_id)


@router.get("/olts/{olt_id}/auth-onu-count", summary="Get authorized ONU count via SNMP")
def get_auth_onu_count(olt_id: int):
    return olt_service.get_olt_auth_onu_count(olt_id)


@router.get("/olts/{olt_id}/power-consumption", summary="Get OLT power consumption via SNMP")
def get_power_consumption(olt_id: int):
    return olt_service.get_olt_power_consumption(olt_id)


@router.get("/olts/{olt_id}/uplink-optical-power", summary="Get uplink optical power via SNMP")
def get_uplink_optical_power(olt_id: int):
    return olt_service.get_olt_uplink_optical_power(olt_id)


@router.get("/olts/{olt_id}/traffic/interfaces", summary="Get interface traffic via SNMP")
def get_interface_traffic(olt_id: int):
    return olt_service.get_olt_interface_traffic(olt_id)


@router.get("/olts/{olt_id}/port-status", summary="Get OLT port status via CLI")
def get_port_status(
    olt_id: int,
    port: Optional[str] = Query(None, min_length=1, description="Port identifier (ex.: 1:1)"),
):
    return olt_service.get_olt_port_status(olt_id, port=port)


@router.get("/olts/{olt_id}/slot-status", summary="Get slot status via CLI")
def get_slot_status(olt_id: int):
    return olt_service.get_olt_slot_status(olt_id)


@router.get("/olts/{olt_id}/card-status", summary="Get card status via CLI")
def get_card_status(olt_id: int):
    return olt_service.get_olt_card_status(olt_id)


@router.get("/olts/{olt_id}/version", summary="Get OLT version via CLI")
def get_olt_version(olt_id: int):
    return olt_service.get_olt_version(olt_id)


@router.get("/olts/{olt_id}/ip-info", summary="Get OLT IP info via CLI")
def get_ip_info(olt_id: int):
    return olt_service.get_olt_ipinfo(olt_id)


@router.post("/olts/{olt_id}/vlans", summary="Create VLAN via CLI")
def create_vlan(olt_id: int, request: VlanCreateRequest):
    return olt_service.create_vlan(olt_id, request.vlan_id, vlan_type=request.vlan_type)


@router.delete("/olts/{olt_id}/vlans/{vlan_id}", summary="Delete VLAN via CLI")
def delete_vlan(olt_id: int, vlan_id: int):
    return olt_service.delete_vlan(olt_id, vlan_id)


@router.get("/olts/{olt_id}/vlans", summary="List VLANs via CLI")
def list_vlans(
    olt_id: int,
    show_all: bool = Query(False, description="Use show vlan all"),
):
    return olt_service.list_vlans(olt_id, show_all=show_all)
