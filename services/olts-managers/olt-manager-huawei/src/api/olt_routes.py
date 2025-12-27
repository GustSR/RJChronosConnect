"""
Rotas de API relacionadas à OLT (Optical Line Terminal).

Este módulo contém todos os endpoints específicos para gerenciamento da OLT,
incluindo configuração de portas PON, perfis, backup/restore e administração.
"""

from fastapi import APIRouter, Query
from typing import List, Optional

from ..services import olt_service
from ..core.validators import validate_olt_id, validate_port

# Imports de schemas OLT (organizados)
from ..schemas.olt import (
    board_info as board_info_schema,
    olt_version as olt_version_schema,
    port_state as port_state_schema,
    port_mode_set_request as port_mode_set_request_schema,
    dba_profile_add_request as dba_profile_add_request_schema,
    gpon_alarm_profile_add_request as gpon_alarm_profile_add_request_schema,
    gpon_password_request as gpon_password_request_schema,
    optical_threshold_request as optical_threshold_request_schema,
    olt_snmp_info as olt_snmp_info_schema,
    snmp_walk as snmp_walk_schema,
    vlan_request as vlan_request_schema,
    user_request as user_request_schema,
    backup_request as backup_request_schema,
    sysname_request as sysname_request_schema
)

# Imports de schemas compartilhados
from ..schemas import command_response as command_response_schema

router = APIRouter(prefix="/api/v1", tags=["OLT"])

def _build_port(frame: int, slot: int, pon_port: int) -> str:
    return validate_port(f"{frame}/{slot}/{pon_port}")

# ============================================================================
# ENDPOINTS DE GESTÃO DE PORTAS PON
# ============================================================================

@router.post("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/shutdown", response_model=command_response_schema.CommandResponse, summary="Shutdown PON Port")
def shutdown_pon_port(olt_id: int, frame: int, slot: int, pon_port: int):
    """Desativa uma porta PON específica da OLT."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    return olt_service.shutdown_pon_port(olt_id, port_str)

@router.post("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/enable", response_model=command_response_schema.CommandResponse, summary="Enable PON Port")
def enable_pon_port(olt_id: int, frame: int, slot: int, pon_port: int):
    """Ativa uma porta PON específica da OLT."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    return olt_service.enable_pon_port(olt_id, port_str)

@router.get("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/state", response_model=port_state_schema.PortState, summary="Get PON Port State")
def get_pon_port_state(olt_id: int, frame: int, slot: int, pon_port: int):
    """Obtém o estado atual de uma porta PON (ativa/inativa, estatísticas)."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    return olt_service.get_port_state(olt_id, port_str)

@router.put("/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/mode", response_model=command_response_schema.CommandResponse, summary="Set PON Port Mode")
def set_pon_port_mode(olt_id: int, frame: int, slot: int, pon_port: int, request: port_mode_set_request_schema.PortModeSetRequest):
    """Configura o modo de operação de uma porta PON (GPON, EPON, etc.)."""
    validate_olt_id(olt_id)
    port_str = _build_port(frame, slot, pon_port)
    return olt_service.set_port_mode(olt_id, port_str, request)

# ============================================================================
# ENDPOINTS DE MONITORAMENTO E INFORMAÇÕES
# ============================================================================

@router.get("/olts/{olt_id}/board-info", response_model=List[board_info_schema.BoardInfo], summary="Get board info")
def get_board_info(olt_id: int):
    """Obtém informações detalhadas sobre as placas instaladas na OLT."""
    validate_olt_id(olt_id)
    return olt_service.get_board_info(olt_id)

@router.get("/olts/{olt_id}/version", response_model=olt_version_schema.OltVersion, summary="Get OLT version")
def get_olt_version(olt_id: int):
    """Obtém informações de versão de software e hardware da OLT."""
    validate_olt_id(olt_id)
    return olt_service.get_olt_version(olt_id)

@router.get("/olts/{olt_id}/snmp-info", response_model=olt_snmp_info_schema.OltSnmpInfo, summary="Get OLT SNMP system info")
def get_olt_snmp_info(olt_id: int):
    """Obtém informações básicas via SNMP (sysDescr, sysName, sysObjectID, sysUpTime)."""
    validate_olt_id(olt_id)
    return olt_service.get_olt_snmp_info(olt_id)

@router.get(
    "/olts/{olt_id}/snmp-walk",
    response_model=List[snmp_walk_schema.SnmpWalkItem],
    summary="SNMP walk (debug)",
)
def snmp_walk(
    olt_id: int,
    oid: str = Query(..., min_length=1, description="OID base para walk"),
    contains: Optional[str] = Query(None, description="Filtro por substring em texto/hex"),
    limit: int = Query(200, ge=1, le=2000),
    timeout: int = Query(5, ge=1, le=30),
    retries: int = Query(1, ge=0, le=5),
):
    """Executa um SNMP walk em um OID específico para diagnóstico."""
    validate_olt_id(olt_id)
    return olt_service.snmp_walk(
        olt_id,
        oid=oid,
        contains=contains,
        limit=limit,
        timeout=timeout,
        retries=retries,
    )

@router.get("/olts/{olt_id}/configuration", summary="Get Current Configuration")
def get_current_configuration(olt_id: int):
    """Obtém a configuração atual completa da OLT."""
    validate_olt_id(olt_id)
    return olt_service.get_current_configuration(olt_id)

# ============================================================================
# ENDPOINTS DE GESTÃO DE PERFIS
# ============================================================================

@router.post("/olts/{olt_id}/dba-profiles", response_model=command_response_schema.CommandResponse, summary="Add DBA Profile")
def add_dba_profile(olt_id: int, request: dba_profile_add_request_schema.DbaProfileAddRequest):
    """Adiciona um novo perfil DBA (Dynamic Bandwidth Allocation) na OLT."""
    validate_olt_id(olt_id)
    return olt_service.add_dba_profile(olt_id, request)

@router.post("/olts/{olt_id}/gpon-alarm-profiles", response_model=command_response_schema.CommandResponse, summary="Add GPON Alarm Profile")
def add_gpon_alarm_profile(olt_id: int, request: gpon_alarm_profile_add_request_schema.GponAlarmProfileAddRequest):
    """Adiciona um novo perfil de alarmes GPON na OLT."""
    validate_olt_id(olt_id)
    return olt_service.add_gpon_alarm_profile(olt_id, request)

# ============================================================================
# ENDPOINTS DE CONFIGURAÇÃO AVANÇADA
# ============================================================================

@router.post("/olts/{olt_id}/interfaces/gpon/password", response_model=command_response_schema.CommandResponse, summary="Set GPON Password")
def set_gpon_password(olt_id: int, request: gpon_password_request_schema.GponPasswordRequest):
    """Configura senha de autenticação GPON para uma interface específica."""
    validate_olt_id(olt_id)
    return olt_service.set_gpon_password(olt_id, request)

@router.post("/olts/{olt_id}/interfaces/optical/thresholds", response_model=command_response_schema.CommandResponse, summary="Set Optical Threshold")
def set_optical_threshold(olt_id: int, request: optical_threshold_request_schema.OpticalThresholdRequest):
    """Configura thresholds de potência óptica para alarmes."""
    validate_olt_id(olt_id)
    return olt_service.set_optical_threshold(olt_id, request)

@router.delete("/olts/{olt_id}/interfaces/{frame}/{slot}/{port}/optical/thresholds", response_model=command_response_schema.CommandResponse, summary="Remove Optical Thresholds")
def remove_optical_thresholds(olt_id: int, frame: int, slot: int, port: int):
    """Remove thresholds de potência óptica configurados."""
    validate_olt_id(olt_id)
    return olt_service.remove_optical_thresholds(olt_id, frame, slot, port)

# ============================================================================
# ENDPOINTS DE GESTÃO DE VLAN
# ============================================================================

@router.post("/olts/{olt_id}/vlans", response_model=command_response_schema.CommandResponse, summary="Create VLAN")
def create_vlan(olt_id: int, request: vlan_request_schema.VlanCreateRequest):
    """Cria uma nova VLAN na OLT."""
    validate_olt_id(olt_id)
    return olt_service.create_vlan(
        olt_id,
        request.vlan_id,
        description=request.description,
        vlan_type=request.vlan_type,
    )

@router.delete("/olts/{olt_id}/vlans/{vlan_id}", response_model=command_response_schema.CommandResponse, summary="Delete VLAN")
def delete_vlan(olt_id: int, vlan_id: int):
    """Remove uma VLAN específica da OLT."""
    validate_olt_id(olt_id)
    return olt_service.delete_vlan(olt_id, vlan_id)

@router.post("/olts/{olt_id}/vlans/assign-port", response_model=command_response_schema.CommandResponse, summary="Assign Port to VLAN")
def assign_port_to_vlan(olt_id: int, request: vlan_request_schema.VlanAssignPortRequest):
    """Atribui uma porta a uma VLAN específica."""
    validate_olt_id(olt_id)
    return olt_service.assign_port_to_vlan(
        olt_id,
        request.vlan_id,
        request.frame,
        request.slot,
        request.port,
    )

# ============================================================================
# ENDPOINTS DE GESTÃO DE USUÁRIOS
# ============================================================================

@router.post("/olts/{olt_id}/users", response_model=command_response_schema.CommandResponse, summary="Create User")
def create_user(olt_id: int, request: user_request_schema.UserCreateRequest):
    """Cria um novo usuário de administração na OLT."""
    validate_olt_id(olt_id)
    return olt_service.create_user(
        olt_id,
        request.username,
        request.password,
        service_type=request.service_type,
        privilege_level=request.privilege_level,
    )

@router.delete("/olts/{olt_id}/users/{username}", response_model=command_response_schema.CommandResponse, summary="Delete User")
def delete_user(olt_id: int, username: str):
    """Remove um usuário de administração da OLT."""
    validate_olt_id(olt_id)
    return olt_service.delete_user(olt_id, username)

@router.put("/olts/{olt_id}/users/{username}/password", response_model=command_response_schema.CommandResponse, summary="Change User Password")
def change_user_password(olt_id: int, username: str, request: user_request_schema.UserPasswordChangeRequest):
    """Altera a senha de um usuário de administração."""
    validate_olt_id(olt_id)
    return olt_service.change_user_password(olt_id, username, request.new_password)

# ============================================================================
# ENDPOINTS DE BACKUP E RESTORE
# ============================================================================

@router.post("/olts/{olt_id}/backup", summary="Backup Configuration")
def backup_configuration(olt_id: int, request: backup_request_schema.BackupRequest):
    """Realiza backup da configuração completa da OLT."""
    validate_olt_id(olt_id)
    return olt_service.backup_configuration(olt_id, request)

@router.post("/olts/{olt_id}/restore", response_model=command_response_schema.CommandResponse, summary="Restore Configuration")
def restore_configuration(olt_id: int, request: backup_request_schema.BackupRequest):
    """Restaura configuração da OLT a partir de um backup."""
    validate_olt_id(olt_id)
    return olt_service.restore_configuration(olt_id, request)

# ============================================================================
# ENDPOINTS DE IDENTIFICAÇÃO E NAMING
# ============================================================================

@router.post("/olts/{olt_id}/set-hostname", response_model=command_response_schema.CommandResponse, summary="Set OLT Hostname")
def set_olt_hostname(olt_id: int, request: sysname_request_schema.SysnameRequest, user_id: str = None, force: bool = False):
    """
    Define o nome (hostname/sysname) da OLT para identificação amigável.

    Este endpoint permite definir um nome amigável para a OLT que será:
    - Usado como identificador principal no sistema
    - Exibido no prompt da OLT
    - Incluído nos eventos do RabbitMQ
    - Usado para rastreabilidade e logs

    Inclui proteções avançadas para evitar problemas operacionais.
    """
    validate_olt_id(olt_id)
    return olt_service.set_olt_hostname(olt_id, request, user_id, force)


@router.post("/olts/{olt_id}/validate-hostname-change", summary="Validate Hostname Change")
def validate_hostname_change(olt_id: int, new_sysname: str, user_id: str = None):
    """
    Valida se uma mudança de hostname pode ser realizada com segurança.

    Executa todas as verificações de proteção antes de permitir a mudança:
    - Verificação de duplicidade
    - Validação de formato
    - Verificação de cooldown
    - Análise de impacto nos sistemas
    """
    validate_olt_id(olt_id)
    return olt_service.validate_sysname_change(olt_id, new_sysname, user_id)


@router.get("/olts/{olt_id}/hostname", summary="Get Current Hostname")
def get_olt_hostname(olt_id: int):
    """
    Obtém o hostname/sysname atual da OLT.

    Retorna o nome configurado atualmente no equipamento.
    """
    validate_olt_id(olt_id)
    return olt_service.get_olt_sysname(olt_id)


@router.post("/olts/{olt_id}/rollback-hostname", response_model=command_response_schema.CommandResponse, summary="Rollback Hostname Change")
def rollback_olt_hostname(olt_id: int, user_id: str = None, reason: str = None):
    """
    Faz rollback da última mudança de hostname da OLT.

    Permite reverter para o nome anterior dentro de uma janela de tempo
    limitada (1 hora por padrão).
    """
    validate_olt_id(olt_id)
    return olt_service.rollback_olt_sysname(olt_id, user_id, reason)


@router.get("/olts/{olt_id}/hostname-audit", summary="Get Hostname Change Audit")
def get_hostname_audit(olt_id: int):
    """
    Obtém histórico completo de mudanças de hostname de uma OLT.

    Retorna auditoria detalhada incluindo:
    - Todas as mudanças realizadas
    - Usuários que executaram as mudanças
    - Timestamps e razões
    - Disponibilidade de rollback
    """
    validate_olt_id(olt_id)
    return olt_service.get_sysname_audit(olt_id)
