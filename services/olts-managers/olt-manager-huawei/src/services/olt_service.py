import inspect
import requests
from typing import List, Dict, Any, Optional

from ..core.config import settings
from ..core.logging import get_logger
# Connection manager não usado diretamente - usando connection pool
from ..services.connection_pool import pool_manager
# Imports de comandos ONT (clientes)
from ..commands.onts.snmp.get_ont_info_snmp import GetOntInfoSnmpCommand
from ..commands.onts.snmp.get_ont_optical_info_snmp import GetOntOpticalInfoSnmpCommand
from ..commands.onts.ssh.add_ont import AddOntCommand
from ..commands.onts.ssh.reboot_ont import RebootOntCommand
from ..commands.onts.ssh.get_service_port_cli import GetServicePortCliCommand
from ..commands.onts.ssh.add_ont_line_profile import AddOntLineProfileCommand
from ..commands.onts.ssh.add_ont_srv_profile import AddOntSrvProfileCommand
from ..commands.onts.snmp.get_ont_port_state_snmp import GetOntPortStateSnmpCommand
from ..commands.onts.ssh.pon_port_control import PonPortControlCommand
from ..commands.onts.ssh.get_ont_autofind_cli import GetOntAutofindCliCommand
from ..commands.onts.snmp.get_ont_autofind_snmp import GetOntAutofindSnmpCommand
from ..commands.onts.ssh.get_all_autofind_onts import GetAllAutofindOntsCommand
from ..commands.onts.ssh.ont_confirm import OntConfirmCommand
from ..commands.onts.snmp.get_ont_port_attribute_snmp import GetOntPortAttributeSnmpCommand
from ..commands.onts.snmp.get_ont_eth_stats_snmp import GetOntEthStatsSnmpCommand
from ..commands.onts.snmp.get_ont_traffic_snmp import GetOntTrafficSnmpCommand
from ..commands.onts.ssh.get_ont_failed_cli import GetOntFailedCliCommand
from ..commands.onts.ssh.add_service_port import AddServicePortCommand
from ..commands.onts.ssh.get_ont_register_info_cli import GetOntRegisterInfoCliCommand
from ..commands.onts.ssh.get_mac_address_cli import GetMacAddressCliCommand

# Imports de comandos OLT (equipamento)
from ..commands.olts.ssh.add_dba_profile import AddDbaProfileCommand
from ..commands.olts.ssh.add_gpon_alarm_profile import AddGponAlarmProfileCommand
from ..commands.olts.ssh.get_board_cli import GetBoardCliCommand
from ..commands.olts.ssh.get_port_state_cli import GetPortStateCliCommand
from ..commands.olts.ssh.set_port_mode import SetPortModeCommand
from ..commands.olts.ssh.set_gpon_password import SetGponPasswordCommand
from ..commands.olts.ssh.set_optical_threshold import SetOpticalThresholdCommand, RemoveOpticalThresholdCommand
from ..commands.olts.ssh.get_current_configuration_cli import GetCurrentConfigurationCliCommand
from ..commands.olts.ssh.manage_vlan import CreateVlanCommand, DeleteVlanCommand, AssignPortToVlanCommand
from ..commands.olts.ssh.manage_users import CreateUserCommand, DeleteUserCommand, ChangeUserPasswordCommand
from ..commands.olts.ssh.backup_restore import BackupConfigurationCommand, RestoreConfigurationCommand
from ..commands.olts.ssh.set_sysname import SetSysnameCommand
from ..commands.olts.ssh.validate_sysname_change import ValidateSysnameChangeCommand, GetSysnameCommand
from ..commands.olts.ssh.rollback_sysname import RollbackSysnameCommand, SysnameAuditCommand
from ..commands.olts.snmp.get_olt_snmp_info import GetOltSnmpInfoCommand
from ..commands.olts.snmp.snmp_walk import SnmpWalkCommand
from ..services.route_report_service import RouteReportService
from ..schemas.report import route_report as route_report_schema
# Imports de schemas ONT
from ..schemas.ont import (
    ont_add_request,
    ont_line_profile_add_request,
    ont_srv_profile_add_request,
    ont_confirm_request
)

# Imports de schemas OLT
from ..schemas.olt import (
    dba_profile_add_request,
    gpon_alarm_profile_add_request,
    port_mode_set_request
)

# Imports de schemas compartilhados
from ..schemas import service_port_add_request

logger = get_logger(__name__)

import yaml

def _get_olt_credentials(olt_id: int) -> dict:
    """
    Retorna as credenciais para uma OLT específica, buscando primeiro no backend-api
    e, como fallback, no arquivo olt_config.yaml.
    """
    try:
        endpoint = f"{settings.backend_api_url}/internal/olts/{olt_id}/credentials"
        logger.info(f"Buscando credenciais para OLT ID {olt_id} em {endpoint}")
        response = requests.get(endpoint, timeout=5)
        response.raise_for_status()
        credentials = response.json()
        logger.info(f"Credenciais para OLT ID {olt_id} obtidas com sucesso do backend-api.")
        if "access_protocol" not in credentials:
            credentials["access_protocol"] = "ssh"
        return credentials
    except requests.exceptions.RequestException as e:
        logger.warning(f"Falha ao buscar credenciais do backend-api: {e}. Tentando fallback para o arquivo de configuração local.")
        try:
            with open("olt_config.yaml", "r") as f:
                config = yaml.safe_load(f)
                for olt in config.get("olts", []):
                    if olt.get("id") == olt_id:
                        logger.info(f"Credenciais para OLT ID {olt_id} encontradas no arquivo de configuração local.")
                        if "access_protocol" not in olt:
                            olt["access_protocol"] = "ssh"
                        return olt
            raise Exception(f"Credenciais para OLT ID {olt_id} não encontradas no arquivo de configuração local.")
        except (FileNotFoundError, yaml.YAMLError) as ex:
            logger.critical(f"Falha ao ler o arquivo de configuração local olt_config.yaml: {ex}")
            raise Exception(f"Não foi possível obter as credenciais para a OLT ID {olt_id}.")

def _get_olt_version(connection_manager) -> str:
    try:
        output = connection_manager.send_command("display version")
        version_line = next((line for line in output.splitlines() if 'V800R' in line), None)
        return version_line.split()[0] if version_line else "unknown"
    except Exception:
        return "unknown"

def _resolve_access_params(credentials: Dict[str, Any]) -> Dict[str, Any]:
    protocol = (credentials.get("access_protocol") or "ssh").lower()
    port = credentials.get("ssh_port")
    if not port:
        port = 23 if protocol == "telnet" else 22
    return {"protocol": protocol, "port": port}

# Helper for CLI commands (com connection pooling)
def _execute_cli_command(olt_id: int, command_class, **kwargs):
    credentials = _get_olt_credentials(olt_id)
    if not all([credentials.get('host'), credentials.get('username'), credentials.get('password')]):
        raise ValueError(f"Missing access credentials for OLT ID {olt_id}")
    
    connection = None
    try:
        access_params = _resolve_access_params(credentials)
        # Obtém conexão do pool
        connection = pool_manager.get_connection(
            host=credentials['host'], 
            username=credentials['username'], 
            password=credentials['password'],
            protocol=access_params["protocol"],
            port=access_params["port"],
        )
        
        if not connection:
            raise Exception(f"Não foi possível obter conexão para OLT ID {olt_id}")
        
        if getattr(connection, "protocol", "") == "telnet":
            olt_version = "unknown"
        else:
            olt_version = _get_olt_version(connection)
        def _init_accepts_kwargs() -> bool:
            if not kwargs:
                return True
            params = inspect.signature(command_class.__init__).parameters
            if any(param.kind == param.VAR_KEYWORD for param in params.values()):
                return True
            allowed = {
                name
                for name, param in params.items()
                if name != "self" and param.kind in (param.POSITIONAL_OR_KEYWORD, param.KEYWORD_ONLY)
            }
            return set(kwargs.keys()).issubset(allowed)

        def _execute_accepts_kwargs(command) -> bool:
            params = inspect.signature(command.execute).parameters
            return any(param.kind == param.VAR_KEYWORD for param in params.values())

        init_accepts_kwargs = _init_accepts_kwargs()
        command = command_class(**kwargs) if init_accepts_kwargs else command_class()
        execute_accepts_kwargs = _execute_accepts_kwargs(command)
        if kwargs and not init_accepts_kwargs and not execute_accepts_kwargs:
            raise TypeError(
                f"{command_class.__name__} não aceita parâmetros: {', '.join(sorted(kwargs.keys()))}"
            )

        if execute_accepts_kwargs:
            result = command.execute(connection, olt_version, **kwargs)
        else:
            result = command.execute(connection, olt_version)
        
        logger.debug(f"Comando {command_class.__name__} executado com sucesso via pool")
        return result
        
    except Exception as e:
        logger.error(f"Falha durante a execução do comando CLI {command_class.__name__}: {e}")
        raise
    finally:
        # Retorna conexão para o pool
        if connection:
            pool_manager.return_connection(
                host=credentials['host'], 
                username=credentials['username'], 
                protocol=access_params["protocol"],
                port=access_params["port"],
                connection=connection
            )

# Helper for SNMP commands
def _execute_snmp_command(olt_id: int, command_class, **kwargs):
    credentials = _get_olt_credentials(olt_id)
    if not all([credentials.get('host'), credentials.get('snmp_community')]):
        raise ValueError(f"Missing SNMP credentials for OLT ID {olt_id}")
    try:
        command = command_class(host=credentials['host'], community_string=credentials['snmp_community'], **kwargs)
        return command.execute()
    except Exception as e:
        logger.error(f"Falha durante a execução do comando SNMP {command_class.__name__}: {e}")
        raise

def get_olt_version(olt_id: int) -> Dict[str, str]:
    """Gets the OLT version."""
    credentials = _get_olt_credentials(olt_id)
    if not all([credentials.get('host'), credentials.get('username'), credentials.get('password')]):
        raise ValueError(f"Missing access credentials for OLT ID {olt_id}")
    
    connection = None
    try:
        access_params = _resolve_access_params(credentials)
        # Obtém conexão do pool
        connection = pool_manager.get_connection(
            host=credentials['host'], 
            username=credentials['username'], 
            password=credentials['password'],
            protocol=access_params["protocol"],
            port=access_params["port"],
        )
        
        if not connection:
            raise Exception(f"Não foi possível obter conexão para OLT ID {olt_id}")
        
        version = _get_olt_version(connection)
        return {"version": version}
        
    except Exception as e:
        logger.error(f"Falha ao obter a versão da OLT: {e}")
        raise
    finally:
        # Retorna conexão para o pool
        if connection:
            pool_manager.return_connection(
                host=credentials['host'], 
                username=credentials['username'], 
                protocol=access_params["protocol"],
                port=access_params["port"],
                connection=connection
            )

def get_board_info(olt_id: int, frame_id: int) -> List[Dict[str, Any]]:
    """Gets the board info for a specific frame."""
    return _execute_cli_command(olt_id, GetBoardCliCommand, frame_id=frame_id)

def get_port_state(olt_id: int, port: str) -> Dict[str, Any]:
    """Gets the state of a specific port."""
    return _execute_cli_command(olt_id, GetPortStateCliCommand, port=port)

def get_ont_failed(olt_id: int) -> List[Dict[str, Any]]:
    """Gets the list of failed ONTs."""
    return _execute_cli_command(olt_id, GetOntFailedCliCommand)

def add_gpon_alarm_profile(olt_id: int, alarm_profile_data: gpon_alarm_profile_add_request.GponAlarmProfileAddRequest) -> Dict[str, Any]:
    """Adds a new GPON alarm profile."""
    return _execute_cli_command(olt_id, AddGponAlarmProfileCommand, **alarm_profile_data.dict())

def add_service_port(olt_id: int, service_port_data: service_port_add_request.ServicePortAddRequest) -> Dict[str, Any]:
    """Adds a new service port."""
    return _execute_cli_command(olt_id, AddServicePortCommand, **service_port_data.dict())

def set_port_mode(olt_id: int, port: str, port_mode_data: port_mode_set_request.PortModeSetRequest) -> Dict[str, Any]:
    """Sets the mode of a specific port."""
    return _execute_cli_command(olt_id, SetPortModeCommand, port=port, **port_mode_data.dict())

def get_ont_info_by_sn(olt_id: int, serial_number: str) -> List[Dict[str, Any]]:
    return _execute_snmp_command(olt_id, GetOntInfoSnmpCommand, serial_number=serial_number)

def get_onts_on_port(olt_id: int, port: str) -> List[Dict[str, Any]]:
    """Gets a summary of all ONTs on a specific port."""
    return _execute_snmp_command(olt_id, GetOntInfoSnmpCommand, port=port)

def get_ont_register_info(olt_id: int, port: str) -> List[Dict[str, Any]]:
    """Gets the registration history for a specific port."""
    return _execute_cli_command(olt_id, GetOntRegisterInfoCliCommand, port=port)

def get_ont_port_attribute(olt_id: int, port: str, ont_id: int, eth_port_id: int) -> Dict[str, Any]:
    """Gets the attributes of a specific ONT Ethernet port."""
    return _execute_snmp_command(olt_id, GetOntPortAttributeSnmpCommand, port=port, ont_id=ont_id, eth_port_id=eth_port_id)

def get_ont_eth_stats(olt_id: int, port: str, ont_id: int, eth_port_id: int) -> Dict[str, Any]:
    """Gets the statistics of a specific ONT Ethernet port."""
    return _execute_snmp_command(olt_id, GetOntEthStatsSnmpCommand, port=port, ont_id=ont_id, eth_port_id=eth_port_id)

def get_ont_traffic(olt_id: int, port: str, ont_id: int) -> List[Dict[str, Any]]:
    """Gets the traffic of a specific ONT."""
    return _execute_snmp_command(olt_id, GetOntTrafficSnmpCommand, port=port, ont_id=ont_id)

def get_ont_optical_info(olt_id: int, port: str, ont_id_on_port: int) -> Dict[str, Any]:
    # Refactored to use SNMP
    return _execute_snmp_command(olt_id, GetOntOpticalInfoSnmpCommand, port=port, ont_id=ont_id_on_port)

def provision_ont(olt_id: int, ont_data: ont_add_request.ONTAddRequest) -> Dict[str, Any]:
    return _execute_cli_command(olt_id, AddOntCommand, **ont_data.dict())

def reboot_ont(olt_id: int, port: str, ont_id_on_port: int) -> Dict[str, Any]:
    return _execute_cli_command(olt_id, RebootOntCommand, port=port, ont_id=ont_id_on_port)

def get_service_ports_for_ont(olt_id: int, port: str, ont_id_on_port: int) -> List[Dict[str, Any]]:
    return _execute_cli_command(olt_id, GetServicePortCliCommand, port=port, ont_id=ont_id_on_port)

def add_dba_profile(olt_id: int, dba_profile_data: dba_profile_add_request.DbaProfileAddRequest) -> Dict[str, Any]:
    return _execute_cli_command(olt_id, AddDbaProfileCommand, **dba_profile_data.dict())

def add_ont_line_profile(olt_id: int, line_profile_data: ont_line_profile_add_request.OntLineProfileAddRequest) -> Dict[str, Any]:
    tconts_dict = [t.dict() for t in line_profile_data.tconts]
    gem_ports_dict = [g.dict() for g in line_profile_data.gem_ports]
    return _execute_cli_command(
        olt_id, 
        AddOntLineProfileCommand, 
        profile_name=line_profile_data.profile_name,
        tconts=tconts_dict,
        gem_ports=gem_ports_dict
    )

def add_ont_srv_profile(olt_id: int, srv_profile_data: ont_srv_profile_add_request.OntSrvProfileAddRequest) -> Dict[str, Any]:
    return _execute_cli_command(olt_id, AddOntSrvProfileCommand, **srv_profile_data.dict())

def get_ont_port_state(olt_id: int, port: str, ont_id_on_port: int) -> List[Dict[str, Any]]:
    return _execute_snmp_command(olt_id, GetOntPortStateSnmpCommand, port=port, ont_id=ont_id_on_port)

def get_olt_snmp_info(olt_id: int) -> Dict[str, Any]:
    """Gets basic OLT system information via SNMP."""
    return _execute_snmp_command(olt_id, GetOltSnmpInfoCommand)

def snmp_walk(
    olt_id: int,
    oid: str,
    contains: Optional[str] = None,
    limit: int = 200,
    timeout: int = 5,
    retries: int = 1,
) -> List[Dict[str, Any]]:
    """Performs a debug SNMP walk under a given OID subtree."""
    return _execute_snmp_command(
        olt_id,
        SnmpWalkCommand,
        oid=oid,
        contains=contains,
        limit=limit,
        timeout=timeout,
        retries=retries,
    )

def get_mac_address_for_ont(olt_id: int, port: str, ont_id_on_port: int) -> List[Dict[str, Any]]:
    return _execute_cli_command(olt_id, GetMacAddressCliCommand, port=port, ont_id=ont_id_on_port)

def get_mac_addresses_on_port(olt_id: int, port: str) -> Dict[str, Any]:
    """Gets MAC addresses learned on a specific port."""
    return _execute_cli_command(olt_id, GetMacAddressCliCommand, port=port)


def shutdown_pon_port(olt_id: int, port: str) -> Dict[str, Any]:
    return _execute_cli_command(olt_id, PonPortControlCommand, port=port, action='shutdown')


def enable_pon_port(olt_id: int, port: str) -> Dict[str, Any]:
    return _execute_cli_command(olt_id, PonPortControlCommand, port=port, action='enable')

def get_autofind_onts(olt_id: int, port: str) -> List[Dict[str, Any]]:
    return _execute_cli_command(olt_id, GetOntAutofindCliCommand, port=port)

def get_all_autofind_onts(olt_id: int) -> List[Dict[str, Any]]:
    """
    Obtém todas as ONUs em autofind de todos os slots/portas PON de uma OLT.
    Orquestra as chamadas para listar boards GPON e buscar autofind em cada porta.
    """
    return _execute_cli_command(olt_id, GetAllAutofindOntsCommand)

def get_autofind_onts_snmp(
    olt_id: int,
    serial_number: Optional[str] = None,
    port: Optional[str] = None,
    limit: int = 200,
    timeout: int = 5,
    retries: int = 1,
) -> List[Dict[str, Any]]:
    credentials = _get_olt_credentials(olt_id)
    olt_model = credentials.get("model", "MA5600T")
    results = _execute_snmp_command(
        olt_id,
        GetOntAutofindSnmpCommand,
        serial_number=serial_number,
        olt_model=olt_model,
        limit=limit,
        timeout=timeout,
        retries=retries,
    )
    if port:
        results = [ont for ont in results if ont.get("port") == port]
    return results

def confirm_ont(olt_id: int, port: str, ont_id: int, confirm_data: ont_confirm_request.OntConfirmRequest) -> Dict[str, Any]:
    return _execute_cli_command(
        olt_id,
        OntConfirmCommand,
        port=port,
        ont_id=ont_id,
        serial_number=confirm_data.serial_number,
        ont_line_profile_name=confirm_data.ont_line_profile_name,
        ont_srv_profile_name=confirm_data.ont_srv_profile_name
    )

# ========== FUNÇÕES DE CONFIGURAÇÃO AVANÇADA ==========

def set_gpon_password(olt_id: int, frame: int, slot: int, password: str) -> Dict[str, Any]:
    """Configura senha de autenticação para interface GPON."""
    return _execute_cli_command(olt_id, SetGponPasswordCommand, frame=frame, slot=slot, password=password)

def set_optical_threshold(olt_id: int, frame: int, slot: int, port: int, parameter: str, 
                         limit_type: str, value: float) -> Dict[str, Any]:
    """Configura threshold de alarme para módulo óptico."""
    return _execute_cli_command(olt_id, SetOpticalThresholdCommand, 
                               frame=frame, slot=slot, port=port, 
                               parameter=parameter, limit_type=limit_type, value=value)

def remove_optical_threshold(olt_id: int, frame: int, slot: int, port: int) -> Dict[str, Any]:
    """Remove todos os thresholds de alarme do módulo óptico."""
    return _execute_cli_command(olt_id, RemoveOpticalThresholdCommand, 
                               frame=frame, slot=slot, port=port)

def get_current_configuration(olt_id: int, section: str = None, save_to_file: bool = False) -> Dict[str, Any]:
    """Obtém configuração atual completa da OLT."""
    return _execute_cli_command(olt_id, GetCurrentConfigurationCliCommand, 
                               section=section, save_to_file=save_to_file)

# ========== FUNÇÕES DE GERENCIAMENTO DE VLAN ==========

def create_vlan(olt_id: int, vlan_id: int, description: str = "", vlan_type: str = "smart") -> Dict[str, Any]:
    """Cria uma VLAN na OLT."""
    return _execute_cli_command(olt_id, CreateVlanCommand, 
                               vlan_id=vlan_id, description=description, vlan_type=vlan_type)

def delete_vlan(olt_id: int, vlan_id: int) -> Dict[str, Any]:
    """Remove uma VLAN da OLT."""
    return _execute_cli_command(olt_id, DeleteVlanCommand, vlan_id=vlan_id)

def assign_port_to_vlan(olt_id: int, vlan_id: int, frame: int, slot: int, port: int) -> Dict[str, Any]:
    """Associa uma porta a uma VLAN."""
    return _execute_cli_command(olt_id, AssignPortToVlanCommand, 
                               vlan_id=vlan_id, frame=frame, slot=slot, port=port)

# ========== FUNÇÕES DE GERENCIAMENTO DE USUÁRIOS ==========

def create_user(olt_id: int, username: str, password: str, service_type: str = "ssh", 
                privilege_level: int = 15) -> Dict[str, Any]:
    """Cria um usuário na OLT."""
    return _execute_cli_command(olt_id, CreateUserCommand, 
                               username=username, password=password, 
                               service_type=service_type, privilege_level=privilege_level)

def delete_user(olt_id: int, username: str) -> Dict[str, Any]:
    """Remove um usuário da OLT."""
    return _execute_cli_command(olt_id, DeleteUserCommand, username=username)

def change_user_password(olt_id: int, username: str, new_password: str) -> Dict[str, Any]:
    """Altera senha de um usuário."""
    return _execute_cli_command(olt_id, ChangeUserPasswordCommand, 
                               username=username, new_password=new_password)

# ========== FUNÇÕES DE BACKUP E RESTORE ==========

def _normalize_backup_request(backup_type: Any, include_passwords: bool) -> Dict[str, Any]:
    if hasattr(backup_type, "backup_type"):
        return {
            "backup_type": backup_type.backup_type,
            "include_passwords": getattr(backup_type, "include_passwords", False),
        }
    if isinstance(backup_type, dict) and "backup_type" in backup_type:
        return {
            "backup_type": backup_type.get("backup_type", "full"),
            "include_passwords": backup_type.get("include_passwords", False),
        }
    return {"backup_type": backup_type, "include_passwords": include_passwords}


def backup_configuration(olt_id: int, backup_type: str = "full", include_passwords: bool = False) -> Dict[str, Any]:
    """Faz backup da configuração da OLT."""
    normalized = _normalize_backup_request(backup_type, include_passwords)
    return _execute_cli_command(
        olt_id,
        BackupConfigurationCommand,
        backup_type=normalized["backup_type"],
        include_passwords=normalized["include_passwords"],
    )

def _normalize_restore_request(backup_data: Any, restore_type: str) -> Dict[str, Any]:
    if hasattr(backup_data, "backup_data"):
        return {
            "backup_data": backup_data.backup_data,
            "restore_type": getattr(backup_data, "restore_type", "full"),
        }
    if isinstance(backup_data, dict) and "backup_data" in backup_data:
        return {
            "backup_data": backup_data.get("backup_data", {}),
            "restore_type": backup_data.get("restore_type", "full"),
        }
    return {"backup_data": backup_data, "restore_type": restore_type}


def restore_configuration(olt_id: int, backup_data: Dict[str, Any], restore_type: str = "full") -> Dict[str, Any]:
    """Restaura configuração da OLT a partir de backup."""
    normalized = _normalize_restore_request(backup_data, restore_type)
    return _execute_cli_command(
        olt_id,
        RestoreConfigurationCommand,
        backup_data=normalized["backup_data"],
        restore_type=normalized["restore_type"],
    )

# ========== FUNÇÕES DE IDENTIFICAÇÃO E NAMING ==========

def set_olt_hostname(olt_id: int, request, user_id: str = None, force: bool = False) -> Dict[str, Any]:
    """
    Define o nome (hostname/sysname) da OLT para identificação amigável.

    Inclui proteções avançadas para evitar problemas operacionais.

    Args:
        olt_id: ID da OLT
        request: Objeto SysnameRequest contendo o novo nome
        user_id: ID do usuário executando a operação (opcional)
        force: Se True, força mudança ignorando proteções (apenas para admin)

    Returns:
        Dict com resultado da operação
    """
    return _execute_cli_command(
        olt_id,
        SetSysnameCommand,
        sysname=request.sysname,
        olt_id=olt_id,
        user_id=user_id,
        force=force
    )


def validate_sysname_change(olt_id: int, new_sysname: str, user_id: str = None) -> Dict[str, Any]:
    """
    Valida se uma mudança de sysname pode ser realizada com segurança.

    Args:
        olt_id: ID da OLT
        new_sysname: Novo nome desejado
        user_id: ID do usuário solicitando a validação (opcional)

    Returns:
        Dict com resultado da validação
    """
    return _execute_cli_command(
        olt_id,
        ValidateSysnameChangeCommand,
        olt_id=olt_id,
        new_sysname=new_sysname,
        user_id=user_id
    )


def get_olt_sysname(olt_id: int) -> Dict[str, Any]:
    """
    Obtém o sysname atual da OLT.

    Args:
        olt_id: ID da OLT

    Returns:
        Dict contendo o sysname atual
    """
    return _execute_cli_command(olt_id, GetSysnameCommand)


def rollback_olt_sysname(olt_id: int, user_id: str = None, reason: str = None) -> Dict[str, Any]:
    """
    Faz rollback da última mudança de sysname da OLT.

    Args:
        olt_id: ID da OLT
        user_id: ID do usuário executando o rollback (opcional)
        reason: Motivo do rollback (opcional)

    Returns:
        Dict com resultado da operação
    """
    return _execute_cli_command(
        olt_id,
        RollbackSysnameCommand,
        olt_id=olt_id,
        user_id=user_id,
        reason=reason
    )


def get_sysname_audit(olt_id: int) -> Dict[str, Any]:
    """
    Obtém histórico completo de mudanças de sysname de uma OLT.

    Args:
        olt_id: ID da OLT

    Returns:
        Dict contendo histórico de mudanças
    """
    return _execute_cli_command(olt_id, SysnameAuditCommand, olt_id=olt_id)


# ========== RELATORIO DE ROTA (LOS) ==========

def get_route_report_service(
    olt_id: int, timeout: int = 5, retries: int = 1
) -> RouteReportService:
    credentials = _get_olt_credentials(olt_id)
    if not all([credentials.get("host"), credentials.get("snmp_community")]):
        raise ValueError(f"Missing SNMP credentials for OLT ID {olt_id}")
    return RouteReportService(
        host=credentials["host"],
        community_string=credentials["snmp_community"],
        timeout=timeout,
        retries=retries,
    )


def build_route_report(
    olt_id: int,
    port: Optional[str],
    if_index: Optional[int],
    los_threshold: int,
    timeout: int,
    retries: int,
) -> route_report_schema.RouteReport:
    service = get_route_report_service(olt_id, timeout=timeout, retries=retries)
    return service.build_report(
        olt_id=olt_id,
        if_index=if_index,
        port=port,
        los_threshold=los_threshold,
    )


def list_gpon_ports(
    olt_id: int, timeout: int = 5, retries: int = 1
) -> List[Dict[str, Any]]:
    service = get_route_report_service(olt_id, timeout=timeout, retries=retries)
    return service.list_gpon_ports()
