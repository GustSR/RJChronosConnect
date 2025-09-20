import requests
from typing import List, Dict, Any

from ..core.config import settings
from ..core.logging import get_logger
# Connection manager não usado diretamente - usando connection pool
from ..services.connection_pool import pool_manager
# Imports de comandos ONT (clientes)
from ..commands.ont.get_ont_info_snmp import GetOntInfoSnmpCommand
from ..commands.ont.get_ont_optical_info_snmp import GetOntOpticalInfoSnmpCommand
from ..commands.ont.add_ont import AddOntCommand
from ..commands.ont.reboot_ont import RebootOntCommand
from ..commands.ont.get_service_port_cli import GetServicePortCliCommand
from ..commands.ont.add_ont_line_profile import AddOntLineProfileCommand
from ..commands.ont.add_ont_srv_profile import AddOntSrvProfileCommand
from ..commands.ont.get_ont_port_state_snmp import GetOntPortStateSnmpCommand
from ..commands.ont.pon_port_control import PonPortControlCommand
from ..commands.ont.get_ont_autofind_cli import GetOntAutofindCliCommand
from ..commands.ont.get_all_autofind_onts import GetAllAutofindOntsCommand
from ..commands.ont.ont_confirm import OntConfirmCommand
from ..commands.ont.get_ont_port_attribute_snmp import GetOntPortAttributeSnmpCommand
from ..commands.ont.get_ont_eth_stats_snmp import GetOntEthStatsSnmpCommand
from ..commands.ont.get_ont_traffic_snmp import GetOntTrafficSnmpCommand
from ..commands.ont.get_ont_failed_cli import GetOntFailedCliCommand
from ..commands.ont.add_service_port import AddServicePortCommand
from ..commands.ont.get_ont_register_info_cli import GetOntRegisterInfoCliCommand
from ..commands.ont.get_mac_address_cli import GetMacAddressCliCommand

# Imports de comandos OLT (equipamento)
from ..commands.olt.add_dba_profile import AddDbaProfileCommand
from ..commands.olt.add_gpon_alarm_profile import AddGponAlarmProfileCommand
from ..commands.olt.get_board_cli import GetBoardCliCommand
from ..commands.olt.get_port_state_cli import GetPortStateCliCommand
from ..commands.olt.set_port_mode import SetPortModeCommand
from ..commands.olt.set_gpon_password import SetGponPasswordCommand
from ..commands.olt.set_optical_threshold import SetOpticalThresholdCommand, RemoveOpticalThresholdCommand
from ..commands.olt.get_current_configuration_cli import GetCurrentConfigurationCliCommand
from ..commands.olt.manage_vlan import CreateVlanCommand, DeleteVlanCommand, AssignPortToVlanCommand
from ..commands.olt.manage_users import CreateUserCommand, DeleteUserCommand, ChangeUserPasswordCommand
from ..commands.olt.backup_restore import BackupConfigurationCommand, RestoreConfigurationCommand
from ..commands.olt.set_sysname import SetSysnameCommand
from ..commands.olt.validate_sysname_change import ValidateSysnameChangeCommand, GetSysnameCommand
from ..commands.olt.rollback_sysname import RollbackSysnameCommand, SysnameAuditCommand
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
        endpoint = f"{settings.backend_api_url}/api/v1/olts/{olt_id}/credentials"
        logger.info(f"Buscando credenciais para OLT ID {olt_id} em {endpoint}")
        response = requests.get(endpoint, timeout=5)
        response.raise_for_status()
        credentials = response.json()
        logger.info(f"Credenciais para OLT ID {olt_id} obtidas com sucesso do backend-api.")
        return credentials
    except requests.exceptions.RequestException as e:
        logger.warning(f"Falha ao buscar credenciais do backend-api: {e}. Tentando fallback para o arquivo de configuração local.")
        try:
            with open("olt_config.yaml", "r") as f:
                config = yaml.safe_load(f)
                for olt in config.get("olts", []):
                    if olt.get("id") == olt_id:
                        logger.info(f"Credenciais para OLT ID {olt_id} encontradas no arquivo de configuração local.")
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

# Helper for CLI commands (com connection pooling)
def _execute_cli_command(olt_id: int, command_class, **kwargs):
    credentials = _get_olt_credentials(olt_id)
    if not all([credentials.get('host'), credentials.get('username'), credentials.get('password')]):
        raise ValueError(f"Missing SSH credentials for OLT ID {olt_id}")
    
    connection = None
    try:
        # Obtém conexão do pool
        connection = pool_manager.get_connection(
            host=credentials['host'], 
            username=credentials['username'], 
            password=credentials['password']
        )
        
        if not connection:
            raise Exception(f"Não foi possível obter conexão SSH para OLT ID {olt_id}")
        
        olt_version = _get_olt_version(connection)
        command = command_class(**kwargs)
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
        raise ValueError(f"Missing SSH credentials for OLT ID {olt_id}")
    
    connection = None
    try:
        # Obtém conexão do pool
        connection = pool_manager.get_connection(
            host=credentials['host'], 
            username=credentials['username'], 
            password=credentials['password']
        )
        
        if not connection:
            raise Exception(f"Não foi possível obter conexão SSH para OLT ID {olt_id}")
        
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

def get_mac_address_for_ont(olt_id: int, port: str, ont_id_on_port: int) -> List[Dict[str, Any]]:
    return _execute_cli_command(olt_id, GetMacAddressCliCommand, port=port, ont_id=ont_id_on_port)


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

def backup_configuration(olt_id: int, backup_type: str = "full", include_passwords: bool = False) -> Dict[str, Any]:
    """Faz backup da configuração da OLT."""
    return _execute_cli_command(olt_id, BackupConfigurationCommand, 
                               backup_type=backup_type, include_passwords=include_passwords)

def restore_configuration(olt_id: int, backup_data: Dict[str, Any], restore_type: str = "full") -> Dict[str, Any]:
    """Restaura configuração da OLT a partir de backup."""
    return _execute_cli_command(olt_id, RestoreConfigurationCommand,
                               backup_data=backup_data, restore_type=restore_type)

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