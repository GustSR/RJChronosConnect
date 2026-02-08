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
    ont_srv_profile_add_request as ont_srv_profile_add_request_schema,
    ont_wan_config_request as ont_wan_config_request_schema,
    ont_tr069_config_request as ont_tr069_config_request_schema
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

@router.delete("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/onts/{ont_id_on_port}", response_model=command_response_schema.CommandResponse, summary="Delete ONT")
def delete_ont(olt_id: int, frame: int, slot: int, pon_port: int, ont_id_on_port: int):
    """Remove uma ONU da OLT."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    validate_ont_id(ont_id_on_port)
    return olt_service.delete_ont(olt_id, port_str, ont_id_on_port)

@router.post("/olts/{olt_id}/onts/configure-wan", response_model=command_response_schema.CommandResponse, summary="Configure ONT WAN/TR-069")
def configure_ont_wan(olt_id: int, request: ont_wan_config_request_schema.OntWanConfigRequest):
    """Configura parâmetros de WAN (VLAN, IP) e TR-069 em uma ONU existente (busca por SN)."""
    validate_olt_id(olt_id)
    return olt_service.configure_ont_wan_tr069(olt_id, request)

# ============================================================================
# OPERAÇÕES ATÔMICAS (PARA SAGAS/ORQUESTRAÇÃO)
# ============================================================================

@router.post("/olts/{olt_id}/onts/simple", response_model=command_response_schema.CommandResponse, summary="[Atomic] Provision ONT Basic")
def provision_ont_simple(olt_id: int, request: ont_add_request_schema.ONTAddRequest):
    """
    Operação atômica: Apenas cria a ONT na OLT.
    Não configura WAN, TR-069 ou Service Ports.
    Ideal para ser usada pelo orquestrador de eventos.
    """
    validate_olt_id(olt_id)
    return olt_service.provision_ont_basic(olt_id, request)

@router.post("/olts/{olt_id}/onts/wan-config-only", response_model=command_response_schema.CommandResponse, summary="[Atomic] Configure WAN Only")
def configure_wan_only(olt_id: int, request: ont_wan_config_request_schema.OntWanConfigRequest):
    """
    Operação atômica: Apenas configura a WAN IP.
    Ignora TR-069 e Service Ports.
    """
    validate_olt_id(olt_id)
    # Busca a porta correta se foi passado SN (lógica auxiliar deve estar no service ou client, 
    # mas aqui chamamos o método atômico direto, assumindo que quem chama sabe os dados ou o service resolve)
    
    # Nota: O método configure_ont_wan_only espera parâmetros explícitos, vamos extrair do request
    return olt_service.configure_ont_wan_only(
        olt_id, 
        request.port, 
        request.ont_id, 
        request.mgmt_vlan,
        request.ip_mode,
        request.ip_address,
        request.mask,
        request.gateway,
        request.ip_index,
        request.priority
    )

@router.post("/olts/{olt_id}/onts/tr069-config-only", response_model=command_response_schema.CommandResponse, summary="[Atomic] Configure TR-069 Only")
def configure_tr069_only(olt_id: int, request: ont_tr069_config_request_schema.OntTr069ConfigRequest):
    """
    Operação atômica: Apenas configura o TR-069.
    """
    validate_olt_id(olt_id)
    return olt_service.configure_ont_tr069_only(
        olt_id, 
        request.port, 
        request.ont_id, 
        request.profile_id
    )

@router.post("/olts/{olt_id}/service-ports/atomic", response_model=command_response_schema.CommandResponse, summary="[Atomic] Create Service Port")
def create_service_port_atomic(olt_id: int, port: str, ont_id: int, vlan: int, user_vlan: Optional[int] = None, gemport: int = 1):
    """
    Operação atômica: Cria uma service-port de internet.
    Se user_vlan não for informado, usa o mesmo valor de vlan.
    """
    validate_olt_id(olt_id)
    # Se não vier user_vlan, assume que é igual à vlan (comportamento padrão)
    uvlan = user_vlan if user_vlan is not None else vlan
    return olt_service.create_internet_service_port(olt_id, port, ont_id, vlan, uvlan, gemport)

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
