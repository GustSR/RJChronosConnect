from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from typing import List

from .services import olt_service
from .trap_listener.listener import TrapListener
from .core.exceptions import OLTException, OLTObjectNotFound
from .core.logging import get_logger
from .core.validators import (
    validate_olt_id, validate_port, validate_ont_id, 
    validate_frame_id, validate_eth_port_id, validate_serial_number
)
from .services.connection_pool import pool_manager
from .schemas import (
    ont as ont_schema,
    ont_summary as ont_summary_schema,
    ont_register_info as ont_register_info_schema,
    ont_port_attribute as ont_port_attribute_schema,
    ont_eth_stats as ont_eth_stats_schema,
    ont_traffic as ont_traffic_schema,
    olt_version as olt_version_schema,
    gpon_alarm_profile_add_request as gpon_alarm_profile_add_request_schema,
    board_info as board_info_schema,
    port_state as port_state_schema,
    ont_failed as ont_failed_schema,
    command_response as command_response_schema,
    port_mode_set_request as port_mode_set_request_schema,
    ont_add_request as ont_add_request_schema,
    ont_optical_info as optical_schema,
    service_port as service_port_schema,
    service_port_add_request as service_port_add_request_schema,
    ont_port_state as ont_port_state_schema,
    mac_address_info as mac_address_schema,
    ont_autofind_info as ont_autofind_schema,
    ont_confirm_request as ont_confirm_schema,
    dba_profile_add_request as dba_profile_add_request_schema,
    ont_line_profile_add_request as ont_line_profile_add_request_schema,
    ont_srv_profile_add_request as ont_srv_profile_add_request_schema,
    # Novos schemas para configuração avançada
    gpon_password_request as gpon_password_request_schema,
    optical_threshold_request as optical_threshold_request_schema,
    vlan_request as vlan_request_schema,
    user_request as user_request_schema,
    backup_request as backup_request_schema
)

app = FastAPI(
    title="OLT Manager - Huawei",
    description="A microservice to interact with Huawei OLTs via SSH.",
    version="0.5.0"
)

@app.exception_handler(OLTException)
async def olt_exception_handler(request: Request, exc: OLTException):
    return JSONResponse(
        status_code=400,
        content={"message": f"Erro na OLT: {exc.message}", "details": exc.extra},
    )

@app.exception_handler(OLTObjectNotFound)
async def olt_object_not_found_handler(request: Request, exc: OLTObjectNotFound):
    return JSONResponse(
        status_code=404,
        content={"message": f"Objeto não encontrado na OLT: {exc.message}", "details": exc.extra},
    )

# --- Trap Listener Lifecycle ---

trap_listener = TrapListener()

logger = get_logger(__name__)

@app.on_event("startup")
def startup_event():
    """Inicia o listener de traps quando a aplicação FastAPI inicia."""
    try:
        logger.info("Iniciando serviço OLT Manager - Huawei")
        trap_listener.iniciar()
        logger.info("Listener de traps SNMP iniciado com sucesso")
    except Exception as e:
        # Se o listener falhar ao iniciar, a aplicação ainda pode funcionar,
        # mas vamos logar o erro crítico.
        logger.critical(f"O listener de traps SNMP falhou ao iniciar: {e}")

@app.on_event("shutdown")
def shutdown_event():
    """Para o listener de traps quando a aplicação FastAPI é encerrada."""
    logger.info("Encerrando serviço OLT Manager - Huawei")
    trap_listener.parar()
    pool_manager.close_all()
    logger.info("Serviço encerrado com sucesso")

# --- Port Management Endpoints ---

@app.post("/api/v1/olts/{olt_id}/ports/{port}/shutdown", response_model=command_response_schema.CommandResponse, summary="Shutdown PON Port", tags=["Port Management"])
def shutdown_pon_port(olt_id: int, port: str):
    validate_olt_id(olt_id)
    validate_port(port)
    return olt_service.shutdown_pon_port(olt_id, port)

@app.post("/api/v1/olts/{olt_id}/ports/{port}/enable", response_model=command_response_schema.CommandResponse, summary="Enable PON Port", tags=["Port Management"])
def enable_pon_port(olt_id: int, port: str):
    validate_olt_id(olt_id)
    validate_port(port)
    return olt_service.enable_pon_port(olt_id, port)

@app.get("/api/v1/olts/{olt_id}/ports/{port}/state", response_model=port_state_schema.PortState, summary="Get PON Port State", tags=["Port Management"])
def get_port_state(olt_id: int, port: str):
    validate_olt_id(olt_id)
    validate_port(port)
    return olt_service.get_port_state(olt_id, port)

@app.put("/api/v1/olts/{olt_id}/ports/{port}/mode", response_model=command_response_schema.CommandResponse, summary="Set PON Port Mode", tags=["Port Management"])
def set_port_mode(olt_id: int, port: str, port_mode_request: port_mode_set_request_schema.PortModeSetRequest):
    return olt_service.set_port_mode(olt_id, port, port_mode_request)

# --- ONT Endpoints ---

@app.get("/api/v1/olts/{olt_id}/onts", response_model=List[ont_schema.ONT], summary="Get ONT info by SN", tags=["ONTs"])
def get_ont_info(olt_id: int, serial_number: str = Query(..., description="ONT SN")):
    validate_olt_id(olt_id)
    validate_serial_number(serial_number)
    return olt_service.get_ont_info_by_sn(olt_id, serial_number)

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/all", response_model=List[ont_summary_schema.ONTSummary], summary="Get all ONTs on a port", tags=["ONTs"])
def get_all_onts_on_port(olt_id: int, port: str):
    validate_olt_id(olt_id)
    validate_port(port)
    return olt_service.get_onts_on_port(olt_id, port)

@app.get("/api/v1/olts/{olt_id}/ports/{port}/register-info", response_model=List[ont_register_info_schema.OntRegisterInfo], summary="Get ONT register info for a port", tags=["ONTs"])
def get_ont_register_info(olt_id: int, port: str):
    validate_olt_id(olt_id)
    validate_port(port)
    return olt_service.get_ont_register_info(olt_id, port)

@app.post("/api/v1/olts/{olt_id}/onts", response_model=command_response_schema.CommandResponse, summary="Provision ONT", tags=["ONTs"])
def provision_new_ont(olt_id: int, ont_request: ont_add_request_schema.ONTAddRequest):
    validate_olt_id(olt_id)
    return olt_service.provision_ont(olt_id, ont_request)

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/optical-info", response_model=optical_schema.ONTOpticalInfo, summary="Get ONT optical info", tags=["ONTs"])
def get_ont_optical_info(olt_id: int, port: str, ont_id_on_port: int):
    validate_olt_id(olt_id)
    validate_port(port)
    validate_ont_id(ont_id_on_port)
    return olt_service.get_ont_optical_info(olt_id, port, ont_id_on_port)

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/eth-ports/{eth_port_id}/attributes", response_model=ont_port_attribute_schema.OntPortAttribute, summary="Get ONT port attributes", tags=["ONTs"])
def get_ont_port_attribute(olt_id: int, port: str, ont_id_on_port: int, eth_port_id: int):
    validate_olt_id(olt_id)
    validate_port(port)
    validate_ont_id(ont_id_on_port)
    validate_eth_port_id(eth_port_id)
    return olt_service.get_ont_port_attribute(olt_id, port, ont_id_on_port, eth_port_id)

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/eth-ports/{eth_port_id}/statistics", response_model=ont_eth_stats_schema.OntEthStats, summary="Get ONT ethernet port statistics", tags=["ONTs"])
def get_ont_eth_stats(olt_id: int, port: str, ont_id_on_port: int, eth_port_id: int):
    return olt_service.get_ont_eth_stats(olt_id, port, ont_id_on_port, eth_port_id)

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/traffic", response_model=List[ont_traffic_schema.OntTraffic], summary="Get ONT traffic", tags=["ONTs"])
def get_ont_traffic(olt_id: int, port: str, ont_id_on_port: int):
    return olt_service.get_ont_traffic(olt_id, port, ont_id_on_port)

@app.post("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/reboot", response_model=command_response_schema.CommandResponse, summary="Reboot ONT", tags=["ONTs"])
def reboot_specific_ont(olt_id: int, port: str, ont_id_on_port: int):
    return olt_service.reboot_ont(olt_id, port, ont_id_on_port)

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/service-ports", response_model=List[service_port_schema.ServicePort], summary="Get ONT service-ports", tags=["ONTs"])
def get_service_ports(olt_id: int, port: str, ont_id_on_port: int):
    return olt_service.get_service_ports_for_ont(olt_id, port, ont_id_on_port)

@app.post("/api/v1/olts/{olt_id}/service-ports", response_model=command_response_schema.CommandResponse, summary="Add a new service port", tags=["ONTs"])
def add_service_port(olt_id: int, service_port_request: service_port_add_request_schema.ServicePortAddRequest):
    return olt_service.add_service_port(olt_id, service_port_request)

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/port-states", response_model=List[ont_port_state_schema.ONTPortState], summary="Get ONT port states", tags=["ONTs"])
def get_ont_port_states(olt_id: int, port: str, ont_id_on_port: int):
    return olt_service.get_ont_port_state(olt_id, port, ont_id_on_port)

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/mac-addresses", response_model=List[mac_address_schema.MacAddressInfo], summary="Get ONT MAC addresses", tags=["ONTs"])
def get_mac_addresses(olt_id: int, port: str, ont_id_on_port: int):
    return olt_service.get_mac_address_for_ont(olt_id, port, ont_id_on_port)

@app.get("/api/v1/olts/{olt_id}/ports/{port}/autofind-onts", response_model=List[ont_autofind_schema.OntAutofindInfo], summary="Get autofind ONTs", tags=["ONTs"])
def get_autofind_onts(olt_id: int, port: str):
    return olt_service.get_autofind_onts(olt_id, port)

@app.post("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/confirm", response_model=command_response_schema.CommandResponse, summary="Confirm an autofind ONT", tags=["ONTs"])
def confirm_ont(olt_id: int, port: str, ont_id_on_port: int, confirm_request: ont_confirm_schema.OntConfirmRequest):
    return olt_service.confirm_ont(olt_id, port, ont_id_on_port, confirm_request)

@app.get("/api/v1/olts/{olt_id}/ports/{port}/failed-onts", response_model=List[ont_failed_schema.OntFailed], summary="Get failed ONTs on a port", tags=["ONTs"])
def get_failed_onts(olt_id: int, port: str):
    return olt_service.get_ont_failed(olt_id, port)

# --- Profile Endpoints ---

@app.post("/api/v1/olts/{olt_id}/gpon-alarm-profiles", response_model=command_response_schema.CommandResponse, summary="Add GPON Alarm Profile", tags=["Profiles"])
def add_new_gpon_alarm_profile(olt_id: int, alarm_profile_request: gpon_alarm_profile_add_request_schema.GponAlarmProfileAddRequest):
    return olt_service.add_gpon_alarm_profile(olt_id, alarm_profile_request)

@app.post("/api/v1/olts/{olt_id}/dba-profiles", response_model=command_response_schema.CommandResponse, summary="Add DBA Profile", tags=["Profiles"])
def add_new_dba_profile(olt_id: int, dba_profile_request: dba_profile_add_request_schema.DbaProfileAddRequest):
    return olt_service.add_dba_profile(olt_id, dba_profile_request)

@app.post("/api/v1/olts/{olt_id}/ont-line-profiles", response_model=command_response_schema.CommandResponse, summary="Add ONT Line Profile", tags=["Profiles"])
def add_new_ont_line_profile(olt_id: int, line_profile_request: ont_line_profile_add_request_schema.OntLineProfileAddRequest):
    try:
        return olt_service.add_ont_line_profile(olt_id, line_profile_request)
    except Exception as e:
        raise OLTException(f"Falha ao adicionar perfil de linha ONT: {str(e)}")

@app.post("/api/v1/olts/{olt_id}/ont-srv-profiles", response_model=command_response_schema.CommandResponse, summary="Add ONT Service Profile", tags=["Profiles"])
def add_new_ont_srv_profile(olt_id: int, srv_profile_request: ont_srv_profile_add_request_schema.OntSrvProfileAddRequest):
    try:
        return olt_service.add_ont_srv_profile(olt_id, srv_profile_request)
    except Exception as e:
        raise OLTException(f"Falha ao adicionar perfil de serviço ONT: {str(e)}")

# --- Monitoring ---

@app.get("/api/v1/olts/{olt_id}/board-info", response_model=List[board_info_schema.BoardInfo], summary="Get board info", tags=["Monitoring"])
def get_board_info(olt_id: int, frame_id: int):
    validate_olt_id(olt_id)
    validate_frame_id(frame_id)
    try:
        return olt_service.get_board_info(olt_id, frame_id)
    except Exception as e:
        raise OLTException(f"Falha ao obter informações da placa: {str(e)}")

@app.get("/api/v1/olts/{olt_id}/version", response_model=olt_version_schema.OltVersion, summary="Get OLT version", tags=["Monitoring"])
def get_olt_version(olt_id: int):
    validate_olt_id(olt_id)
    try:
        return olt_service.get_olt_version(olt_id)
    except Exception as e:
        raise OLTException(f"Falha ao obter versão da OLT: {str(e)}")

@app.get("/health", summary="Health Check", tags=["Monitoring"])
def health_check():
    return {"status": "ok"}

@app.get("/pool-stats", summary="Connection Pool Statistics", tags=["Monitoring"])
def get_pool_stats():
    """Retorna estatísticas dos pools de conexão SSH."""
    try:
        stats = pool_manager.get_all_stats()
        return {
            "status": "ok",
            "pools": stats,
            "total_pools": len(stats)
        }
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas do pool: {e}")
        raise OLTException(f"Falha ao obter estatísticas do pool: {str(e)}")

# ========== ENDPOINTS DE CONFIGURAÇÃO AVANÇADA ==========

@app.post("/api/v1/olts/{olt_id}/interfaces/gpon/password", response_model=command_response_schema.CommandResponse, summary="Set GPON Password", tags=["Advanced Configuration"])
def set_gpon_password(olt_id: int, password_data: gpon_password_request_schema.GponPasswordRequest):
    """Configura senha de autenticação para interface GPON."""
    validate_olt_id(olt_id)
    return olt_service.set_gpon_password(olt_id, password_data.frame, password_data.slot, password_data.password)

@app.post("/api/v1/olts/{olt_id}/interfaces/optical/thresholds", response_model=command_response_schema.CommandResponse, summary="Set Optical Threshold", tags=["Advanced Configuration"])  
def set_optical_threshold(olt_id: int, threshold_data: optical_threshold_request_schema.OpticalThresholdRequest):
    """Configura threshold de alarme para módulo óptico."""
    validate_olt_id(olt_id)
    return olt_service.set_optical_threshold(
        olt_id, threshold_data.frame, threshold_data.slot, threshold_data.port,
        threshold_data.parameter, threshold_data.limit_type, threshold_data.value
    )

@app.delete("/api/v1/olts/{olt_id}/interfaces/{frame}/{slot}/{port}/optical/thresholds", response_model=command_response_schema.CommandResponse, summary="Remove Optical Thresholds", tags=["Advanced Configuration"])
def remove_optical_thresholds(olt_id: int, frame: int, slot: int, port: int):
    """Remove todos os thresholds de alarme do módulo óptico."""
    validate_olt_id(olt_id)
    validate_frame_id(frame)
    return olt_service.remove_optical_threshold(olt_id, frame, slot, port)

@app.get("/api/v1/olts/{olt_id}/configuration", summary="Get Current Configuration", tags=["Advanced Configuration"])
def get_current_configuration(olt_id: int, section: str = None, save_to_file: bool = False):
    """Obtém configuração atual completa da OLT."""
    validate_olt_id(olt_id)
    return olt_service.get_current_configuration(olt_id, section, save_to_file)

# ========== ENDPOINTS DE GERENCIAMENTO DE VLAN ==========

@app.post("/api/v1/olts/{olt_id}/vlans", response_model=command_response_schema.CommandResponse, summary="Create VLAN", tags=["VLAN Management"])
def create_vlan(olt_id: int, vlan_data: vlan_request_schema.VlanCreateRequest):
    """Cria uma VLAN na OLT."""
    validate_olt_id(olt_id)
    return olt_service.create_vlan(olt_id, vlan_data.vlan_id, vlan_data.description, vlan_data.vlan_type)

@app.delete("/api/v1/olts/{olt_id}/vlans/{vlan_id}", response_model=command_response_schema.CommandResponse, summary="Delete VLAN", tags=["VLAN Management"])
def delete_vlan(olt_id: int, vlan_id: int):
    """Remove uma VLAN da OLT."""
    validate_olt_id(olt_id)
    if not (1 <= vlan_id <= 4094):
        raise OLTException("VLAN ID deve estar entre 1 e 4094")
    return olt_service.delete_vlan(olt_id, vlan_id)

@app.post("/api/v1/olts/{olt_id}/vlans/assign-port", response_model=command_response_schema.CommandResponse, summary="Assign Port to VLAN", tags=["VLAN Management"])
def assign_port_to_vlan(olt_id: int, assign_data: vlan_request_schema.VlanAssignPortRequest):
    """Associa uma porta a uma VLAN."""
    validate_olt_id(olt_id)
    return olt_service.assign_port_to_vlan(
        olt_id, assign_data.vlan_id, assign_data.frame, assign_data.slot, assign_data.port
    )

# ========== ENDPOINTS DE GERENCIAMENTO DE USUÁRIOS ==========

@app.post("/api/v1/olts/{olt_id}/users", response_model=command_response_schema.CommandResponse, summary="Create User", tags=["User Management"])
def create_user(olt_id: int, user_data: user_request_schema.UserCreateRequest):
    """Cria um usuário na OLT."""
    validate_olt_id(olt_id)
    return olt_service.create_user(
        olt_id, user_data.username, user_data.password, 
        user_data.service_type, user_data.privilege_level
    )

@app.delete("/api/v1/olts/{olt_id}/users/{username}", response_model=command_response_schema.CommandResponse, summary="Delete User", tags=["User Management"])
def delete_user(olt_id: int, username: str):
    """Remove um usuário da OLT."""
    validate_olt_id(olt_id)
    return olt_service.delete_user(olt_id, username)

@app.put("/api/v1/olts/{olt_id}/users/{username}/password", response_model=command_response_schema.CommandResponse, summary="Change User Password", tags=["User Management"])
def change_user_password(olt_id: int, username: str, password_data: user_request_schema.UserPasswordChangeRequest):
    """Altera senha de um usuário."""
    validate_olt_id(olt_id)
    return olt_service.change_user_password(olt_id, username, password_data.new_password)

# ========== ENDPOINTS DE BACKUP E RESTORE ==========

@app.post("/api/v1/olts/{olt_id}/backup", summary="Backup Configuration", tags=["Backup & Restore"])
def backup_configuration(olt_id: int, backup_data: backup_request_schema.BackupRequest):
    """Faz backup da configuração da OLT."""
    validate_olt_id(olt_id)
    return olt_service.backup_configuration(olt_id, backup_data.backup_type, backup_data.include_passwords)

@app.post("/api/v1/olts/{olt_id}/restore", response_model=command_response_schema.CommandResponse, summary="Restore Configuration", tags=["Backup & Restore"])
def restore_configuration(olt_id: int, restore_data: backup_request_schema.RestoreRequest):
    """Restaura configuração da OLT a partir de backup."""
    validate_olt_id(olt_id)
    return olt_service.restore_configuration(olt_id, restore_data.backup_data, restore_data.restore_type)
