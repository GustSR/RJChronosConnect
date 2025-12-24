"""
Utilitários compartilhados para transformação de dados do GenieACS.
"""

from __future__ import annotations

from datetime import datetime, timedelta
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)


def safe_get_nested(data: Dict[str, Any], path: str, default: Any = None) -> Any:
    """
    Busca um valor aninhado de forma segura usando notação de ponto.

    Args:
        data: Dicionário com os dados
        path: Caminho usando pontos (ex: "InternetGatewayDevice.DeviceInfo.HardwareVersion._value")
        default: Valor padrão se não encontrado

    Returns:
        Valor encontrado ou default
    """
    try:
        keys = path.split('.')
        current = data

        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return default

        return current
    except Exception as e:
        logger.warning(f"Erro ao buscar caminho {path}: {e}")
        return default


def determine_device_status(last_inform: str, threshold_minutes: int = 10) -> str:
    """
    Determina o status do dispositivo baseado no último inform.

    Args:
        last_inform: Data/hora do último inform (ISO string)
        threshold_minutes: Minutos de tolerância para considerar online

    Returns:
        "online" ou "offline"
    """
    try:
        if not last_inform:
            return "offline"

        last_inform_dt = datetime.fromisoformat(last_inform.replace('Z', '+00:00'))
        now = datetime.now(last_inform_dt.tzinfo)

        time_diff = now - last_inform_dt

        if time_diff <= timedelta(minutes=threshold_minutes):
            return "online"
        return "offline"

    except Exception as e:
        logger.warning(f"Erro ao determinar status do dispositivo: {e}")
        return "offline"


def extract_manufacturer_model(device_data: Dict[str, Any]) -> tuple[str, str]:
    """
    Extrai fabricante e modelo do dispositivo.

    Args:
        device_data: Dados do dispositivo do GenieACS

    Returns:
        Tupla (manufacturer, model)
    """
    device_id = device_data.get("_deviceId", {})

    manufacturer = device_id.get("_Manufacturer", "Unknown")
    product_class = device_id.get("_ProductClass", "Unknown")

    # Mapear product classes conhecidos para nomes mais amigáveis
    model_mappings = {
        "BM632w": "Huawei BM632w",
        "HG8310M": "Huawei HG8310M",
        "F601": "ZTE F601",
        "IWR3000N": "Intelbras IWR 3000N",
        "ArcherC6": "TP-Link Archer C6",
    }

    model = model_mappings.get(product_class, product_class)

    return manufacturer, model
