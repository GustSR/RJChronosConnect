"""Transformadores de dados do GenieACS para CPE."""

from __future__ import annotations

from datetime import datetime
import logging
from typing import Any, Dict

from .utils import safe_get_nested, determine_device_status, extract_manufacturer_model

logger = logging.getLogger(__name__)


def transform_genieacs_to_cpe(device_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforma dados do GenieACS em estrutura CPE compatível com o frontend.

    Args:
        device_data: Dados raw do dispositivo do GenieACS

    Returns:
        Dados do CPE formatados
    """
    try:
        device_id = device_data.get("_deviceId", {})

        # Dados básicos
        serial_number = device_id.get("_SerialNumber", "Unknown")
        oui = device_id.get("_OUI", "")

        # ID único combinando OUI, ProductClass e SerialNumber
        cpe_id = device_data.get("_id", f"{oui}-{device_id.get('_ProductClass', '')}-{serial_number}")

        # Manufacturer e modelo
        manufacturer, model = extract_manufacturer_model(device_data)

        # Status baseado no último inform
        last_inform = device_data.get("_lastInform")
        status = determine_device_status(last_inform)

        # IP Address externo - tentar múltiplos caminhos
        external_ip = None

        # Lista de possíveis caminhos para IP externo
        ip_paths = [
            "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.2.ExternalIPAddress._value",
            "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress._value",
            "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.2.WANIPConnection.1.ExternalIPAddress._value",
            "InternetGatewayDevice.Services.X_HUAWEI_WANRemoteAccess.IPAddress2._value",  # IP público do Huawei
            "InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.IPInterface.1.IPInterfaceIPAddress._value",  # IP LAN como fallback
        ]

        # Tentar cada caminho até encontrar um IP válido
        for ip_path in ip_paths:
            ip_candidate = safe_get_nested(device_data, ip_path)
            if ip_candidate and ip_candidate.strip() and ip_candidate != "0.0.0.0":
                external_ip = ip_candidate.strip()
                logger.info(f"✅ IP encontrado para {cpe_id}: {external_ip} (via {ip_path})")
                break

        if not external_ip:
            logger.warning(f"⚠️ Nenhum IP válido encontrado para dispositivo {cpe_id}")

        # WiFi SSID
        wifi_ssid = safe_get_nested(
            device_data,
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID._value",
        )

        # WiFi Enable status
        wifi_enabled = safe_get_nested(
            device_data,
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Enable._value",
            True,
        )

        # Hardware e Software version para informações extras
        hw_version = safe_get_nested(
            device_data,
            "InternetGatewayDevice.DeviceInfo.HardwareVersion._value",
        )

        sw_version = safe_get_nested(
            device_data,
            "InternetGatewayDevice.DeviceInfo.SoftwareVersion._value",
        )

        # Signal strength (simulado baseado no status)
        signal_strength = -45.0 if status == "online" else None

        # Timestamps
        last_seen_dt = None
        created_at_dt = datetime.now()

        if last_inform:
            try:
                last_seen_dt = datetime.fromisoformat(last_inform.replace('Z', '+00:00'))
            except Exception:
                pass

        # Montar estrutura CPE
        cpe_data = {
            "id": cpe_id,
            "serial_number": serial_number,
            "model": model,
            "status": status,
            "ip_address": external_ip,
            "last_seen": last_seen_dt.isoformat() if last_seen_dt else None,
            "created_at": created_at_dt.isoformat(),
            "wifi_enabled": bool(wifi_enabled),
            "wifi_ssid": wifi_ssid,
            "signal_strength": signal_strength,
            "customer_name": f"Cliente {serial_number[-3:]}",  # Simulado

            # Campos extras para debug/informação
            "_genieacs_metadata": {
                "manufacturer": manufacturer,
                "hardware_version": hw_version,
                "software_version": sw_version,
                "oui": oui,
                "product_class": device_id.get("_ProductClass"),
                "last_inform_raw": last_inform,
            },
        }

        return cpe_data

    except Exception as e:
        logger.error(f"Erro ao transformar dispositivo GenieACS em CPE: {e}")
        logger.error(f"Dados do dispositivo: {device_data}")
        return None
