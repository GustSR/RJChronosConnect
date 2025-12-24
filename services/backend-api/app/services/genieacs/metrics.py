"""Calculo de metricas do dashboard."""

from __future__ import annotations

import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


def calculate_dashboard_metrics(devices: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calcula métricas do dashboard baseado nos dispositivos.

    Args:
        devices: Lista de dispositivos processados

    Returns:
        Métricas do dashboard
    """
    try:
        total_devices = len(devices)
        online_devices = len([d for d in devices if d.get("status") == "online"])
        offline_devices = total_devices - online_devices

        # Calcular média de signal strength dos dispositivos online
        signal_strengths = [
            d.get("signal_strength") for d in devices
            if d.get("signal_strength") is not None and d.get("status") == "online"
        ]

        avg_signal_strength = sum(signal_strengths) / len(signal_strengths) if signal_strengths else -50.0

        # Calcular uptime percentage
        uptime_percentage = (online_devices / total_devices * 100) if total_devices > 0 else 100.0

        # SLA compliance baseado no uptime
        sla_compliance = min(uptime_percentage, 100.0)

        return {
            "total_devices": total_devices,
            "online_devices": online_devices,
            "offline_devices": offline_devices,
            "critical_alerts": 0,  # Será calculado separadamente com faults
            "uptime_percentage": round(uptime_percentage, 1),
            "avg_signal_strength": round(avg_signal_strength, 1),
            "avg_latency": 15.2,  # Simulado - requer medições específicas
            "sla_compliance": round(sla_compliance, 1),
        }

    except Exception as e:
        logger.error(f"Erro ao calcular métricas do dashboard: {e}")
        return {
            "total_devices": 0,
            "online_devices": 0,
            "offline_devices": 0,
            "critical_alerts": 0,
            "uptime_percentage": 0.0,
            "avg_signal_strength": -50.0,
            "avg_latency": 0.0,
            "sla_compliance": 0.0,
        }
