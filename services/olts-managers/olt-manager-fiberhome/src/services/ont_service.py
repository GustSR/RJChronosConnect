from typing import Any, Dict, List, Optional

import requests
import yaml

from ..core.config import settings
from ..core.logging import get_logger
from ..services.connection_manager import ConnectionManager
from ..commands.onts.snmp.get_fiberhome_ont_info_snmp import GetFiberhomeOntInfoSnmpCommand
from ..commands.onts.snmp.get_fiberhome_ont_status_snmp import GetFiberhomeOntStatusSnmpCommand
from ..commands.onts.snmp.get_fiberhome_ont_optical_power_snmp import (
    GetFiberhomeOntOpticalPowerSnmpCommand,
)
from ..commands.onts.snmp.set_fiberhome_ont_reboot_snmp import SetFiberhomeOntRebootSnmpCommand
from ..commands.onts.snmp.set_fiberhome_ont_deauthorize_snmp import SetFiberhomeOntDeauthorizeSnmpCommand
from ..commands.onts.ssh.get_fiberhome_onu_discovery_cli import GetFiberhomeOnuDiscoveryCliCommand
from ..commands.onts.ssh.get_fiberhome_onu_online_cli import GetFiberhomeOnuOnlineCliCommand
from ..commands.onts.ssh.add_fiberhome_whitelist_onu_cli import AddFiberhomeWhitelistOnuCliCommand
from ..commands.onts.ssh.remove_fiberhome_whitelist_onu_cli import RemoveFiberhomeWhitelistOnuCliCommand
from ..commands.onts.ssh.configure_fiberhome_onu_service_vlan_cli import (
    ConfigureFiberhomeOnuServiceVlanCliCommand,
)
from ..commands.onts.ssh.configure_fiberhome_onu_tr069_cli import (
    ConfigureFiberhomeOnuTr069CliCommand,
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


def _execute_snmp_command(olt_id: int, command_class, **kwargs):
    credentials = _get_olt_credentials(olt_id)
    host = credentials.get("host")
    community = credentials.get("snmp_community") or settings.snmp_community

    if not host:
        raise ValueError(f"Missing SNMP host for OLT ID {olt_id}")

    command = command_class(host=host, community_string=community, **kwargs)
    return command.execute()


def get_ont_info(olt_id: int) -> List[Dict[str, Any]]:
    return _execute_snmp_command(olt_id, GetFiberhomeOntInfoSnmpCommand)


def get_ont_status(olt_id: int) -> List[Dict[str, Any]]:
    return _execute_snmp_command(olt_id, GetFiberhomeOntStatusSnmpCommand)


def get_ont_optical_power(olt_id: int) -> List[Dict[str, Any]]:
    return _execute_snmp_command(olt_id, GetFiberhomeOntOpticalPowerSnmpCommand)


def reboot_ont(olt_id: int, onu_index: str) -> Dict[str, Any]:
    return _execute_snmp_command(olt_id, SetFiberhomeOntRebootSnmpCommand, onu_index=onu_index)


def deauthorize_ont(olt_id: int, onu_index: str) -> Dict[str, Any]:
    return _execute_snmp_command(olt_id, SetFiberhomeOntDeauthorizeSnmpCommand, onu_index=onu_index)


def get_onu_discovery(olt_id: int) -> Dict[str, Any]:
    return _execute_cli_command(olt_id, GetFiberhomeOnuDiscoveryCliCommand)


def get_onu_online(olt_id: int) -> Dict[str, Any]:
    return _execute_cli_command(olt_id, GetFiberhomeOnuOnlineCliCommand)


def add_onu_whitelist(
    olt_id: int,
    serial_number: str,
    slot: int,
    link: int,
    onu_id: int,
    onu_type: str,
    password: Optional[str] = None,
) -> Dict[str, Any]:
    return _execute_cli_command(
        olt_id,
        AddFiberhomeWhitelistOnuCliCommand,
        serial_number=serial_number,
        slot=slot,
        link=link,
        onu_id=onu_id,
        onu_type=onu_type,
        password=password,
    )


def remove_onu_whitelist(olt_id: int, serial_number: str, slot: int, link: int) -> Dict[str, Any]:
    return _execute_cli_command(
        olt_id,
        RemoveFiberhomeWhitelistOnuCliCommand,
        serial_number=serial_number,
        slot=slot,
        link=link,
    )


def configure_onu_service_vlan(
    olt_id: int,
    slot: int,
    link: int,
    onu_id: int,
    port: int,
    service_number: int,
    vlan_id: int,
    vlan_mode: str,
    tpid: str,
    pvid: Optional[int],
    traffic_type: str,
) -> Dict[str, Any]:
    return _execute_cli_command(
        olt_id,
        ConfigureFiberhomeOnuServiceVlanCliCommand,
        slot=slot,
        link=link,
        onu_id=onu_id,
        port=port,
        service_number=service_number,
        vlan_id=vlan_id,
        vlan_mode=vlan_mode,
        tpid=tpid,
        pvid=pvid,
        traffic_type=traffic_type,
    )


def enable_onu_tr069(
    olt_id: int,
    onu_id: int,
    acs_url: str,
    acs_user: str,
    acs_password: str,
    inform_interval: int,
    port: int,
    cpe_user: Optional[str],
    cpe_password: Optional[str],
    middleware_disable: bool,
    interface_context: Optional[str],
) -> Dict[str, Any]:
    return _execute_cli_command(
        olt_id,
        ConfigureFiberhomeOnuTr069CliCommand,
        onu_id=onu_id,
        enable=True,
        acs_url=acs_url,
        acs_user=acs_user,
        acs_password=acs_password,
        inform_interval=inform_interval,
        port=port,
        cpe_user=cpe_user,
        cpe_password=cpe_password,
        middleware_disable=middleware_disable,
        interface_context=interface_context,
    )


def disable_onu_tr069(olt_id: int, onu_id: int, interface_context: Optional[str]) -> Dict[str, Any]:
    return _execute_cli_command(
        olt_id,
        ConfigureFiberhomeOnuTr069CliCommand,
        onu_id=onu_id,
        enable=False,
        interface_context=interface_context,
    )
