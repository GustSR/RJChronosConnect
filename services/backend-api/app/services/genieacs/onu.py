"""Transformadores de dados do GenieACS para ONU."""

from __future__ import annotations

from datetime import datetime
import logging
from typing import Any, Dict

from .utils import determine_device_status, extract_manufacturer_model

logger = logging.getLogger(__name__)


def transform_genieacs_to_onu(device_data: Dict[str, Any], olt_mapping: Dict[str, str] = None) -> Dict[str, Any]:
    """
    Transforma dados do GenieACS em estrutura ONU.

    Args:
        device_data: Dados raw do dispositivo do GenieACS
        olt_mapping: Mapeamento de dispositivos para OLTs

    Returns:
        Dados da ONU formatados
    """
    try:
        device_id = device_data.get("_deviceId", {})
        serial_number = device_id.get("_SerialNumber", "Unknown")
        oui = device_id.get("_OUI", "")

        onu_id = device_data.get("_id", f"{oui}-{device_id.get('_ProductClass', '')}-{serial_number}")

        manufacturer, model = extract_manufacturer_model(device_data)

        last_inform = device_data.get("_lastInform")
        status = determine_device_status(last_inform)

        # Para ONUs, podemos tentar extrair informações de PON
        # Isso dependeria do modelo específico e parâmetros TR-069 disponíveis
        olt_id = "olt-001"  # Simulado - seria mapeado baseado na rede
        pon_port = "1/1"    # Simulado - extraído de parâmetros específicos

        # Potências RX/TX (simuladas - dependem do modelo)
        rx_power = -18.5 if status == "online" else None
        tx_power = 2.5 if status == "online" else None
        distance = 1.2 if status == "online" else None

        last_seen_dt = None
        if last_inform:
            try:
                last_seen_dt = datetime.fromisoformat(last_inform.replace('Z', '+00:00'))
            except Exception:
                pass

        onu_data = {
            "id": onu_id,
            "serial_number": serial_number,
            "model": model,
            "status": status,
            "olt_id": olt_id,
            "pon_port": pon_port,
            "rx_power": rx_power,
            "tx_power": tx_power,
            "distance": distance,
            "last_seen": last_seen_dt.isoformat() if last_seen_dt else None,
            "created_at": datetime.now().isoformat(),

            "_genieacs_metadata": {
                "manufacturer": manufacturer,
                "oui": oui,
                "product_class": device_id.get("_ProductClass"),
                "last_inform_raw": last_inform,
            },
        }

        return onu_data

    except Exception as e:
        logger.error(f"Erro ao transformar dispositivo GenieACS em ONU: {e}")
        return None
