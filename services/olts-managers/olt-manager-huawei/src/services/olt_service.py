import os
import requests
from typing import List, Dict, Any

from ..services.connection_manager import ConnectionManager
from ..commands.get_ont_info_snmp import GetOntInfoSnmpCommand
from ..commands.get_ont_optical_info_snmp import GetOntOpticalInfoSnmpCommand # Changed
from ..commands.add_ont import AddOntCommand
from ..commands.reboot_ont import RebootOntCommand
from ..commands.display_service_port import DisplayServicePortCommand
from ..commands.add_dba_profile import AddDbaProfileCommand
from ..commands.add_ont_line_profile import AddOntLineProfileCommand
from ..commands.add_ont_srv_profile import AddOntSrvProfileCommand
from ..commands.get_ont_port_state_snmp import GetOntPortStateSnmpCommand
from ..commands.get_mac_address_snmp import GetMacAddressSnmpCommand
from ..commands.pon_port_control import PonPortControlCommand
from ..commands.display_ont_autofind import DisplayOntAutofindCommand
from ..commands.ont_confirm import OntConfirmCommand
from ..commands.get_ont_register_info_snmp import GetOntRegisterInfoSnmpCommand
from ..commands.get_ont_port_attribute_snmp import GetOntPortAttributeSnmpCommand
from ..commands.get_ont_eth_stats_snmp import GetOntEthStatsSnmpCommand
from ..commands.get_ont_traffic_snmp import GetOntTrafficSnmpCommand
from ..commands.add_gpon_alarm_profile import AddGponAlarmProfileCommand
from ..commands.display_board import DisplayBoardCommand
from ..commands.display_port_state import DisplayPortStateCommand
from ..commands.display_ont_failed import DisplayOntFailedCommand
from ..commands.add_service_port import AddServicePortCommand
from ..commands.set_port_mode import SetPortModeCommand
from ..schemas import (
    ont_add_request,
    dba_profile_add_request,
    ont_line_profile_add_request,
    ont_srv_profile_add_request,
    ont_confirm_request,
    gpon_alarm_profile_add_request,
    service_port_add_request,
    port_mode_set_request
)

def _get_olt_credentials(olt_id: int) -> dict:
    """
    Retorna as credenciais para uma OLT específica buscando no backend-api.
    """
    BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://backend-api:8000")
    if not BACKEND_API_URL:
        raise ValueError("A variável de ambiente BACKEND_API_URL não está configurada.")

    endpoint = f"{BACKEND_API_URL}/api/v1/olts/{olt_id}/credentials"
    
    try:
        print(f"[Auth] Buscando credenciais para OLT ID {olt_id} em {endpoint}")
        response = requests.get(endpoint, timeout=5) # Adicionado timeout
        response.raise_for_status()
        credentials = response.json()
        print(f"[Auth] Credenciais para OLT ID {olt_id} obtidas com sucesso.")
        return credentials
    except requests.exceptions.RequestException as e:
        print(f"[ERRO CRÍTICO] Falha ao buscar credenciais da OLT {olt_id}: {e}")
        raise Exception(f"Não foi possível obter as credenciais para a OLT ID {olt_id}.")

def _get_olt_version(connection_manager) -> str:
    try:
        output = connection_manager.send_command("display version")
        version_line = next((line for line in output.splitlines() if 'V800R' in line), None)
        return version_line.split()[0] if version_line else "unknown"
    except Exception:
        return "unknown"

# Helper for CLI commands
def _execute_cli_command(olt_id: int, command_class, **kwargs):
    credentials = _get_olt_credentials(olt_id)
    if not all([credentials.get('host'), credentials.get('username'), credentials.get('password')]):
        raise ValueError(f"Missing SSH credentials for OLT ID {olt_id}")
    try:
        with ConnectionManager(host=credentials['host'], username=credentials['username'], password=credentials['password']) as conn:
            olt_version = _get_olt_version(conn)
            command = command_class(**kwargs)
            return command.execute(conn, olt_version)
    except Exception as e:
        print(f"[Service Error] Failed during CLI command {command_class.__name__}: {e}")
        raise

# Helper for SNMP commands
def _execute_snmp_command(olt_id: int, command_class, **kwargs):
    credentials = _get_olt_credentials(olt_id)
    if not all([credentials.get('host'), credentials.get('snmp_community')]):
        raise ValueError(f"Missing SNMP credentials for OLT ID {olt_id}")
    try:
        command = command_class(host=credentials['host'], community_string=credentials['snmp_community'], **kwargs)
        return command.execute()
    except Exception as e:
        print(f"[Service Error] Failed during SNMP command {command_class.__name__}: {e}")
        raise

def get_olt_version(olt_id: int) -> Dict[str, str]:
    """Gets the OLT version."""
    credentials = _get_olt_credentials(olt_id)
    if not all([credentials.get('host'), credentials.get('username'), credentials.get('password')]):
        raise ValueError(f"Missing SSH credentials for OLT ID {olt_id}")
    try:
        with ConnectionManager(host=credentials['host'], username=credentials['username'], password=credentials['password']) as conn:
            version = _get_olt_version(conn)
            return {"version": version}
    except Exception as e:
        print(f"[Service Error] Failed during get_olt_version: {e}")
        raise

def get_board_info(olt_id: int, frame_id: int) -> List[Dict[str, Any]]:
    """Gets the board info for a specific frame."""
    return _execute_cli_command(olt_id, DisplayBoardCommand, frame_id=frame_id)

def get_port_state(olt_id: int, port: str) -> Dict[str, Any]:
    """Gets the state of a specific port."""
    return _execute_cli_command(olt_id, DisplayPortStateCommand, port=port)

def get_ont_failed(olt_id: int) -> List[Dict[str, Any]]:
    """Gets the list of failed ONTs."""
    return _execute_cli_command(olt_id, DisplayOntFailedCommand)

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
    return _execute_cli_command(olt_id, DisplayOntRegisterInfoCommand, port=port)

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
    return _execute_cli_command(olt_id, DisplayServicePortCommand, port=port, ont_id=ont_id_on_port)

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
    return _execute_cli_command(olt_id, DisplayMacAddressCommand, port=port, ont_id=ont_id_on_port)


def shutdown_pon_port(olt_id: int, port: str) -> Dict[str, Any]:
    return _execute_cli_command(olt_id, PonPortControlCommand, port=port, action='shutdown')


def enable_pon_port(olt_id: int, port: str) -> Dict[str, Any]:
    return _execute_cli_command(olt_id, PonPortControlCommand, port=port, action='enable')

def get_autofind_onts(olt_id: int, port: str) -> List[Dict[str, Any]]:
    return _execute_cli_command(olt_id, DisplayOntAutofindCommand, port=port)

def confirm_ont(olt_id: int, port: str, ont_id: int, confirm_data: ont_confirm_request.OntConfirmRequest) -> Dict[str, Any]:
    return _execute_cli_command(
        olt_id,
        OntConfirmCommand,
        port=port,
        ont_id=ont_id,
        serial_number=confirm_data.serial_number,
        ont_line_profile_name=confirm_data.ont_line_profile_name,
        ont_srv_profile_name=confirm_data.ont_srv_profile_name
    )ame
    )