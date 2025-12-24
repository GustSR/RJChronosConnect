"""Transformadores de faults do GenieACS para alertas."""

from __future__ import annotations

from datetime import datetime
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)


def transform_genieacs_fault_to_alert(fault_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforma fault do GenieACS em alerta do sistema.

    Args:
        fault_data: Dados do fault do GenieACS

    Returns:
        Dados do alerta formatados
    """
    try:
        fault_id = fault_data.get("_id", "unknown")
        device_id = fault_data.get("device", "unknown")

        # Mapear tipos de fault para severidade
        fault_code = fault_data.get("code", "")
        severity_map = {
            "9001": "critical",  # Invalid parameter name
            "9002": "warning",   # Invalid parameter type
            "9003": "warning",   # Invalid parameter value
            "9004": "critical",  # Attempt to set non-writable parameter
            "9005": "info",      # Notification request rejected
            "8001": "critical",  # Method not supported
            "8002": "critical",  # Request denied
            "8003": "critical",  # Internal error
        }

        severity = severity_map.get(str(fault_code), "warning")

        # Título e descrição baseados no fault
        title = fault_data.get("detail", {}).get("faultString", f"Fault {fault_code}")
        description = f"Device: {device_id} - Code: {fault_code} - {title}"

        # Timestamp
        timestamp = fault_data.get("timestamp")
        created_at = datetime.now()

        if timestamp:
            try:
                created_at = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            except Exception:
                pass

        alert_data = {
            "id": f"fault-{fault_id}",
            "device_id": device_id,
            "severity": severity,
            "title": title,
            "description": description,
            "acknowledged": False,
            "created_at": created_at.isoformat(),

            "_genieacs_metadata": {
                "fault_code": fault_code,
                "fault_raw": fault_data,
            },
        }

        return alert_data

    except Exception as e:
        logger.error(f"Erro ao transformar fault GenieACS em alerta: {e}")
        return None
