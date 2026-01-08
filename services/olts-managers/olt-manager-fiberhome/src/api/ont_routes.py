from fastapi import APIRouter

from ..schemas import (
    OnuIndexRequest,
    OnuServiceVlanRequest,
    Tr069DisableRequest,
    Tr069EnableRequest,
    WhitelistAddRequest,
    WhitelistRemoveRequest,
)
from ..services import ont_service

router = APIRouter(prefix="/api/v1", tags=["ONT"])

ONT_COMMANDS = {
    "snmp": [
        {
            "id": "get_ont_info",
            "command": "GetFiberhomeOntInfoSnmpCommand",
            "summary": "Get ONT info via SNMP",
        },
        {
            "id": "get_ont_status",
            "command": "GetFiberhomeOntStatusSnmpCommand",
            "summary": "Get ONT status via SNMP",
        },
        {
            "id": "get_ont_optical_power",
            "command": "GetFiberhomeOntOpticalPowerSnmpCommand",
            "summary": "Get ONT optical power via SNMP",
        },
        {
            "id": "set_ont_reboot",
            "command": "SetFiberhomeOntRebootSnmpCommand",
            "summary": "Reboot ONT via SNMP",
        },
        {
            "id": "set_ont_deauthorize",
            "command": "SetFiberhomeOntDeauthorizeSnmpCommand",
            "summary": "Deauthorize ONT via SNMP",
        },
    ],
    "ssh": [
        {
            "id": "get_onu_discovery",
            "command": "GetFiberhomeOnuDiscoveryCliCommand",
            "summary": "List ONU discovery via CLI",
        },
        {
            "id": "get_onu_online",
            "command": "GetFiberhomeOnuOnlineCliCommand",
            "summary": "List online ONUs via CLI",
        },
        {
            "id": "add_onu_whitelist",
            "command": "AddFiberhomeWhitelistOnuCliCommand",
            "summary": "Add ONU to whitelist via CLI",
        },
        {
            "id": "remove_onu_whitelist",
            "command": "RemoveFiberhomeWhitelistOnuCliCommand",
            "summary": "Remove ONU from whitelist via CLI",
        },
        {
            "id": "configure_onu_service_vlan",
            "command": "ConfigureFiberhomeOnuServiceVlanCliCommand",
            "summary": "Configure ONU service VLAN via CLI",
        },
        {
            "id": "enable_onu_tr069",
            "command": "ConfigureFiberhomeOnuTr069CliCommand",
            "summary": "Enable TR-069 on ONU via CLI",
        },
        {
            "id": "disable_onu_tr069",
            "command": "ConfigureFiberhomeOnuTr069CliCommand",
            "summary": "Disable TR-069 on ONU via CLI",
        },
    ],
}


@router.get("/onts/commands", summary="List ONT commands")
def list_ont_commands():
    return {
        "service": "olt-manager-fiberhome",
        "domain": "ont",
        "commands": ONT_COMMANDS,
    }


@router.get("/olts/{olt_id}/onts/info", summary="Get ONT info via SNMP")
def get_ont_info(olt_id: int):
    return ont_service.get_ont_info(olt_id)


@router.get("/olts/{olt_id}/onts/status", summary="Get ONT status via SNMP")
def get_ont_status(olt_id: int):
    return ont_service.get_ont_status(olt_id)


@router.get("/olts/{olt_id}/onts/optical-power", summary="Get ONT optical power via SNMP")
def get_ont_optical_power(olt_id: int):
    return ont_service.get_ont_optical_power(olt_id)


@router.post("/olts/{olt_id}/onts/reboot", summary="Reboot ONT via SNMP")
def reboot_ont(olt_id: int, request: OnuIndexRequest):
    return ont_service.reboot_ont(olt_id, request.onu_index)


@router.post("/olts/{olt_id}/onts/deauthorize", summary="Deauthorize ONT via SNMP")
def deauthorize_ont(olt_id: int, request: OnuIndexRequest):
    return ont_service.deauthorize_ont(olt_id, request.onu_index)


@router.get("/olts/{olt_id}/onts/discovery", summary="Get ONU discovery via CLI")
def get_onu_discovery(olt_id: int):
    return ont_service.get_onu_discovery(olt_id)


@router.get("/olts/{olt_id}/onts/online", summary="Get online ONUs via CLI")
def get_onu_online(olt_id: int):
    return ont_service.get_onu_online(olt_id)


@router.post("/olts/{olt_id}/onts/whitelist", summary="Add ONU whitelist via CLI")
def add_onu_whitelist(olt_id: int, request: WhitelistAddRequest):
    return ont_service.add_onu_whitelist(
        olt_id,
        serial_number=request.serial_number,
        slot=request.slot,
        link=request.link,
        onu_id=request.onu_id,
        onu_type=request.onu_type,
        password=request.password,
    )


@router.post("/olts/{olt_id}/onts/whitelist/remove", summary="Remove ONU whitelist via CLI")
def remove_onu_whitelist(olt_id: int, request: WhitelistRemoveRequest):
    return ont_service.remove_onu_whitelist(
        olt_id,
        serial_number=request.serial_number,
        slot=request.slot,
        link=request.link,
    )


@router.post("/olts/{olt_id}/onts/service-vlan", summary="Configure ONU service VLAN via CLI")
def configure_onu_service_vlan(olt_id: int, request: OnuServiceVlanRequest):
    return ont_service.configure_onu_service_vlan(
        olt_id,
        slot=request.slot,
        link=request.link,
        onu_id=request.onu_id,
        port=request.port,
        service_number=request.service_number,
        vlan_id=request.vlan_id,
        vlan_mode=request.vlan_mode,
        tpid=request.tpid,
        pvid=request.pvid,
        traffic_type=request.traffic_type,
    )


@router.post("/olts/{olt_id}/onts/tr069/enable", summary="Enable TR-069 on ONU via CLI")
def enable_onu_tr069(olt_id: int, request: Tr069EnableRequest):
    return ont_service.enable_onu_tr069(
        olt_id,
        onu_id=request.onu_id,
        acs_url=request.acs_url,
        acs_user=request.acs_user,
        acs_password=request.acs_password,
        inform_interval=request.inform_interval,
        port=request.port,
        cpe_user=request.cpe_user,
        cpe_password=request.cpe_password,
        middleware_disable=request.middleware_disable,
        interface_context=request.interface_context,
    )


@router.post("/olts/{olt_id}/onts/tr069/disable", summary="Disable TR-069 on ONU via CLI")
def disable_onu_tr069(olt_id: int, request: Tr069DisableRequest):
    return ont_service.disable_onu_tr069(
        olt_id,
        onu_id=request.onu_id,
        interface_context=request.interface_context,
    )
