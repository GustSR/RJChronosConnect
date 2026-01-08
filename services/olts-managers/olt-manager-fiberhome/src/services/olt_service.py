from typing import Any, Dict, List, Optional

import requests
import yaml

from ..core.config import settings
from ..core.logging import get_logger
from ..services.connection_manager import ConnectionManager
from ..commands.olts.snmp.get_fiberhome_olt_system_info_snmp import GetFiberhomeOltSystemInfoSnmpCommand
from ..commands.olts.snmp.get_fiberhome_olt_auth_onu_count_snmp import GetFiberhomeOltAuthOnuCountSnmpCommand
from ..commands.olts.snmp.get_fiberhome_olt_power_consumption_snmp import GetFiberhomeOltPowerConsumptionSnmpCommand
from ..commands.olts.snmp.get_fiberhome_olt_uplink_optical_power_snmp import GetFiberhomeOltUplinkOpticalPowerSnmpCommand
from ..commands.olts.snmp.get_fiberhome_olt_interface_traffic_snmp import (
    GetFiberhomeOltInterfaceTrafficSnmpCommand,
)
from ..commands.olts.ssh.get_fiberhome_port_status_cli import GetFiberhomePortStatusCliCommand
from ..commands.olts.ssh.get_fiberhome_slot_status_cli import GetFiberhomeSlotStatusCliCommand
from ..commands.olts.ssh.get_fiberhome_card_status_cli import GetFiberhomeCardStatusCliCommand
from ..commands.olts.ssh.get_fiberhome_version_cli import GetFiberhomeVersionCliCommand
from ..commands.olts.ssh.get_fiberhome_ipinfo_cli import GetFiberhomeIpInfoCliCommand
from ..commands.olts.ssh.manage_fiberhome_vlan_cli import (
    CreateFiberhomeVlanCliCommand,
    DeleteFiberhomeVlanCliCommand,
    ListFiberhomeVlansCliCommand,
)

logger = get_logger(__name__)


def _get_olt_credentials(olt_id: int) -> Dict[str, Any]:
    try:
        endpoint = f"{settings.backend_api_url}/internal/olts/{olt_id}/credentials"
        response = requests.get(endpoint, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        logger.warning("Backend credentials lookup failed: %s", exc)

    try:
        with open("olt_config.yaml", "r") as handle:
            config = yaml.safe_load(handle) or {}
        for olt in config.get("olts", []):
            if olt.get("id") == olt_id:
                return olt
    except (FileNotFoundError, yaml.YAMLError) as exc:
        logger.error("Failed to read olt_config.yaml: %s", exc)

    raise ValueError(f"Credentials for OLT ID {olt_id} not found")


def _execute_cli_command(olt_id: int, command_class, **kwargs) -> Dict[str, Any]:
    credentials = _get_olt_credentials(olt_id)
    if not all([credentials.get("host"), credentials.get("username"), credentials.get("password")]):
        raise ValueError(f"Missing SSH credentials for OLT ID {olt_id}")

    device_type = credentials.get("device_type", "fiberhome")
    port = int(credentials.get("port", 22))

    with ConnectionManager(
        host=credentials["host"],
        username=credentials["username"],
        password=credentials["password"],
        device_type=device_type,
        port=port,
    ) as connection:
        command = command_class(**kwargs)
        return command.execute(connection, "unknown")


def _execute_snmp_command(olt_id: int, command_class, **kwargs) -> Dict[str, Any]:
    credentials = _get_olt_credentials(olt_id)
    host = credentials.get("host")
    community = credentials.get("snmp_community") or settings.snmp_community

    if not host:
        raise ValueError(f"Missing SNMP host for OLT ID {olt_id}")

    command = command_class(host=host, community_string=community, **kwargs)
    return command.execute()


def get_olt_system_info(olt_id: int) -> Dict[str, Any]:
    return _execute_snmp_command(olt_id, GetFiberhomeOltSystemInfoSnmpCommand)


def get_olt_auth_onu_count(olt_id: int) -> Dict[str, Any]:
    return _execute_snmp_command(olt_id, GetFiberhomeOltAuthOnuCountSnmpCommand)


def get_olt_power_consumption(olt_id: int) -> Dict[str, Any]:
    return _execute_snmp_command(olt_id, GetFiberhomeOltPowerConsumptionSnmpCommand)


def get_olt_uplink_optical_power(olt_id: int) -> Dict[str, Any]:
    return _execute_snmp_command(olt_id, GetFiberhomeOltUplinkOpticalPowerSnmpCommand)


def get_olt_interface_traffic(olt_id: int) -> List[Dict[str, Any]]:
    return _execute_snmp_command(olt_id, GetFiberhomeOltInterfaceTrafficSnmpCommand)


def get_olt_port_status(olt_id: int, port: Optional[str] = None) -> Dict[str, Any]:
    return _execute_cli_command(olt_id, GetFiberhomePortStatusCliCommand, port=port)


def get_olt_slot_status(olt_id: int) -> Dict[str, Any]:
    return _execute_cli_command(olt_id, GetFiberhomeSlotStatusCliCommand)


def get_olt_card_status(olt_id: int) -> Dict[str, Any]:
    return _execute_cli_command(olt_id, GetFiberhomeCardStatusCliCommand)


def get_olt_version(olt_id: int) -> Dict[str, Any]:
    return _execute_cli_command(olt_id, GetFiberhomeVersionCliCommand)


def get_olt_ipinfo(olt_id: int) -> Dict[str, Any]:
    return _execute_cli_command(olt_id, GetFiberhomeIpInfoCliCommand)


def create_vlan(olt_id: int, vlan_id: int, vlan_type: Optional[str] = "smart") -> Dict[str, Any]:
    return _execute_cli_command(
        olt_id,
        CreateFiberhomeVlanCliCommand,
        vlan_id=vlan_id,
        vlan_type=vlan_type,
    )


def delete_vlan(olt_id: int, vlan_id: int) -> Dict[str, Any]:
    return _execute_cli_command(
        olt_id,
        DeleteFiberhomeVlanCliCommand,
        vlan_id=vlan_id,
    )


def list_vlans(olt_id: int, show_all: bool = False) -> Dict[str, Any]:
    return _execute_cli_command(
        olt_id,
        ListFiberhomeVlansCliCommand,
        show_all=show_all,
    )
