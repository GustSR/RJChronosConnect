"""
Rotas de API relacionadas a ONTs/ONUs (Optical Network Terminals).

Este módulo contém todos os endpoints específicos para gerenciamento de ONTs,
incluindo provisionamento, monitoramento, configuração e diagnósticos.
"""

from fastapi import APIRouter, Query
from typing import List, Optional

from ..services import olt_service
from ..core.validators import (
    validate_olt_id, validate_port, validate_ont_id,
    validate_eth_port_id, validate_serial_number
)

# Imports de schemas ONT (organizados)
from ..schemas.ont import (
    ont_snmp as ont_snmp_schema,
    ont_register_info as ont_register_info_schema,
    ont_port_attribute as ont_port_attribute_schema,
    ont_eth_stats as ont_eth_stats_schema,
    ont_traffic as ont_traffic_schema,
    ont_add_request as ont_add_request_schema,
    ont_optical_info as optical_schema,
    ont_port_state as ont_port_state_schema,
    ont_autofind_info as ont_autofind_schema,
    ont_autofind_snmp as ont_autofind_snmp_schema,
    ont_confirm_request as ont_confirm_schema,
    ont_failed as ont_failed_schema,
    ont_line_profile_add_request as ont_line_profile_add_request_schema,
    ont_srv_profile_add_request as ont_srv_profile_add_request_schema
)

# Imports de schemas compartilhados
from ..schemas import (
    command_response as command_response_schema,
    service_port as service_port_schema,
    service_port_add_request as service_port_add_request_schema,
    mac_address_info as mac_address_schema
)

router = APIRouter(prefix="/api/v1", tags=["ONTs"])

def _build_port(frame: int, slot: int, pon_port: int) -> str:
    return validate_port(f"{frame}/{slot}/{pon_port}")

# ============================================================================
# ENDPOINTS DE CONSULTA DE ONT
# ============================================================================

@router.get("/olts/{olt_id}/onts", response_model=List[ont_snmp_schema.OntSnmpInfo], summary="Get ONT info by SN")
def get_ont_info(olt_id: int, serial_number: str = Query(..., description="ONT Serial Number")):
    """Busca informações de uma ONT específica pelo número de série."""
    validate_olt_id(olt_id)
    validate_serial_number(serial_number)
    return olt_service.get_ont_info_by_sn(olt_id, serial_number)

@router.get("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/onts/all", response_model=List[ont_snmp_schema.OntSnmpInfo], summary="Get all ONTs on a port")
def get_all_onts_on_port(olt_id: int, frame: int, slot: int, pon_port: int):
    """Lista todas as ONTs provisionadas em uma porta PON específica."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    return olt_service.get_onts_on_port(olt_id, port_str)

@router.get("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/register-info", response_model=List[ont_register_info_schema.OntRegisterInfo], summary="Get ONT register info for a port")
def get_ont_register_info(olt_id: int, frame: int, slot: int, pon_port: int):
    """Obtém informações de registro de todas as ONTs em uma porta."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    return olt_service.get_ont_register_info(olt_id, port_str)

@router.get("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/onts/{ont_id_on_port}/optical-info", response_model=optical_schema.ONTOpticalInfo, summary="Get ONT optical info")
def get_ont_optical_info(olt_id: int, frame: int, slot: int, pon_port: int, ont_id_on_port: int):
    """Obtém informações ópticas de uma ONT específica (potência RX/TX, atenuação)."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    validate_ont_id(ont_id_on_port)
    return olt_service.get_ont_optical_info(olt_id, port_str, ont_id_on_port)

@router.get("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/onts/{ont_id_on_port}/traffic", response_model=List[ont_traffic_schema.OntTraffic], summary="Get ONT traffic")
def get_ont_traffic(olt_id: int, frame: int, slot: int, pon_port: int, ont_id_on_port: int):
    """Obtém estatísticas de tráfego de uma ONT (bytes/pacotes enviados e recebidos)."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    validate_ont_id(ont_id_on_port)
    return olt_service.get_ont_traffic(olt_id, port_str, ont_id_on_port)

# ============================================================================
# ENDPOINTS DE PORTAS ETHERNET DA ONT
# ============================================================================

@router.get("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/onts/{ont_id_on_port}/eth-ports/{eth_port_id}/attributes", response_model=ont_port_attribute_schema.OntPortAttribute, summary="Get ONT port attributes")
def get_ont_port_attributes(olt_id: int, frame: int, slot: int, pon_port: int, ont_id_on_port: int, eth_port_id: int):
    """Obtém atributos de uma porta Ethernet específica da ONT (velocidade, duplex, status)."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    validate_ont_id(ont_id_on_port)
    validate_eth_port_id(eth_port_id)
    return olt_service.get_ont_port_attributes(olt_id, port_str, ont_id_on_port, eth_port_id)

@router.get("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/onts/{ont_id_on_port}/eth-ports/{eth_port_id}/statistics", response_model=ont_eth_stats_schema.OntEthStats, summary="Get ONT ethernet port statistics")
def get_ont_ethernet_stats(olt_id: int, frame: int, slot: int, pon_port: int, ont_id_on_port: int, eth_port_id: int):
    """Obtém estatísticas detalhadas de uma porta Ethernet da ONT."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    validate_ont_id(ont_id_on_port)
    validate_eth_port_id(eth_port_id)
    return olt_service.get_ont_ethernet_stats(olt_id, port_str, ont_id_on_port, eth_port_id)

@router.get("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/onts/{ont_id_on_port}/port-states", response_model=List[ont_port_state_schema.ONTPortState], summary="Get ONT port states")
def get_ont_port_states(olt_id: int, frame: int, slot: int, pon_port: int, ont_id_on_port: int):
    """Obtém o estado de todas as portas de uma ONT."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    validate_ont_id(ont_id_on_port)
    return olt_service.get_ont_port_state(olt_id, port_str, ont_id_on_port)

# ============================================================================
# ENDPOINTS DE PROVISIONAMENTO E GESTÃO
# ============================================================================

@router.post("/olts/{olt_id}/onts", response_model=command_response_schema.CommandResponse, summary="Provision ONT")
def provision_new_ont(olt_id: int, request: ont_add_request_schema.ONTAddRequest):
    """Provisiona uma nova ONT na OLT com os perfis especificados."""
    validate_olt_id(olt_id)
    return olt_service.provision_ont(olt_id, request)

@router.post("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/onts/{ont_id_on_port}/reboot", response_model=command_response_schema.CommandResponse, summary="Reboot ONT")
def reboot_ont(olt_id: int, frame: int, slot: int, pon_port: int, ont_id_on_port: int):
    """Reinicia uma ONT específica."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    validate_ont_id(ont_id_on_port)
    return olt_service.reboot_ont(olt_id, port_str, ont_id_on_port)

# ============================================================================
# ENDPOINTS DE DESCOBERTA E AUTOFIND
# ============================================================================

@router.get("/olts/{olt_id}/autofind-onts", response_model=List[ont_autofind_schema.OntAutofindInfo], summary="Get autofind ONTs")
def get_autofind_onts(olt_id: int):
    """Lista ONTs descobertas automaticamente mas ainda não provisionadas."""
    validate_olt_id(olt_id)
    return olt_service.get_all_autofind_onts(olt_id)

@router.get(
    "/olts/{olt_id}/autofind-onts/snmp",
    response_model=List[ont_autofind_snmp_schema.OntAutofindSnmpInfo],
    summary="Get autofind ONTs via SNMP",
)
def get_autofind_onts_snmp(
    olt_id: int,
    serial_number: Optional[str] = Query(
        None, description="ONT Serial Number (optional filter)"
    ),
    port: Optional[str] = Query(
        None, description="Port in frame/slot/port format (optional filter)"
    ),
    limit: int = Query(200, ge=1, le=1000),
    timeout: int = Query(5, ge=1, le=30),
    retries: int = Query(1, ge=0, le=5),
):
    """Lista ONTs em autofind via SNMP."""
    validate_olt_id(olt_id)
    if serial_number:
        validate_serial_number(serial_number)
    if port:
        validate_port(port)
    return olt_service.get_autofind_onts_snmp(
        olt_id,
        serial_number=serial_number,
        port=port,
        limit=limit,
        timeout=timeout,
        retries=retries,
    )

@router.get("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/autofind", response_model=List[ont_autofind_schema.OntAutofindInfo], summary="Get autofind ONTs on specific port")
def get_autofind_onts_on_port(olt_id: int, frame: int, slot: int, pon_port: int):
    """Lista ONTs autofind em uma porta específica."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    return olt_service.get_autofind_onts(olt_id, port_str)

@router.post("/olts/{olt_id}/onts/confirm", response_model=command_response_schema.CommandResponse, summary="Confirm autofind ONT")
def confirm_autofind_ont(olt_id: int, request: ont_confirm_schema.OntConfirmRequest):
    """Confirma e provisiona uma ONT descoberta por autofind."""
    validate_olt_id(olt_id)
    return olt_service.confirm_autofind_ont(olt_id, request)

@router.get("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/failed-onts", response_model=List[ont_failed_schema.OntFailed], summary="Get failed ONTs")
def get_failed_onts(olt_id: int, frame: int, slot: int, pon_port: int):
    """Lista ONTs com falhas em uma porta específica."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    failed_onts = olt_service.get_ont_failed(olt_id)
    return [ont for ont in failed_onts if ont.get("fsp") == port_str]

# ============================================================================
# ENDPOINTS DE SERVICE PORTS
# ============================================================================

@router.get("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/onts/{ont_id_on_port}/service-ports", response_model=List[service_port_schema.ServicePort], summary="Get ONT service-ports")
def get_ont_service_ports(olt_id: int, frame: int, slot: int, pon_port: int, ont_id_on_port: int):
    """Lista todas as service-ports configuradas para uma ONT."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    validate_ont_id(ont_id_on_port)
    return olt_service.get_service_ports_for_ont(olt_id, port_str, ont_id_on_port)

@router.post("/olts/{olt_id}/service-ports", response_model=command_response_schema.CommandResponse, summary="Add a new service port")
def add_service_port(olt_id: int, request: service_port_add_request_schema.ServicePortAddRequest):
    """Adiciona uma nova service-port na OLT."""
    validate_olt_id(olt_id)
    return olt_service.add_service_port(olt_id, request)

# ============================================================================
# ENDPOINTS DE PERFIS ONT
# ============================================================================

@router.post("/olts/{olt_id}/ont-line-profiles", response_model=command_response_schema.CommandResponse, summary="Add ONT Line Profile")
def add_ont_line_profile(olt_id: int, request: ont_line_profile_add_request_schema.OntLineProfileAddRequest):
    """Adiciona um novo perfil de linha para ONTs."""
    validate_olt_id(olt_id)
    return olt_service.add_ont_line_profile(olt_id, request)

@router.post("/olts/{olt_id}/ont-srv-profiles", response_model=command_response_schema.CommandResponse, summary="Add ONT Service Profile")
def add_ont_srv_profile(olt_id: int, request: ont_srv_profile_add_request_schema.OntSrvProfileAddRequest):
    """Adiciona um novo perfil de serviço para ONTs."""
    validate_olt_id(olt_id)
    return olt_service.add_ont_srv_profile(olt_id, request)

# ============================================================================
# ENDPOINTS DE ENDEREÇOS MAC
# ============================================================================

@router.get("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/mac-addresses", response_model=List[mac_address_schema.MacAddressInfo], summary="Get MAC addresses on port")
def get_mac_addresses_on_port(olt_id: int, frame: int, slot: int, pon_port: int):
    """Lista endereços MAC aprendidos em uma porta específica."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    return olt_service.get_mac_addresses_on_port(olt_id, port_str)
