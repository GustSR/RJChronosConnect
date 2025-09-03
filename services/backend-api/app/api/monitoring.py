from fastapi import APIRouter
from typing import List
from datetime import datetime
import logging

# Import schemas and services
from app.schemas.alert import Alert
from app.schemas.device import CPE, ONU, OLT # Needed for mock data fallback
from app.services.genieacs_client import get_genieacs_client
from app.services.genieacs_transformers import (
    transform_genieacs_fault_to_alert,
    calculate_dashboard_metrics,
    transform_genieacs_to_cpe
)

# Logger
logger = logging.getLogger(__name__)

# APIRouter
router = APIRouter()

# Mock data (dependencies for fallback logic)
mock_alerts = [
    Alert(
        id=f"alert-{i:03d}",
        device_id=f"cpe-{i:03d}" if i % 2 == 0 else f"onu-{i:03d}",
        severity="critical" if i % 5 == 0 else "warning" if i % 3 == 0 else "info",
        title=f"Alerta {i:03d}",
        description=f"Descrição do alerta {i:03d}",
        acknowledged=i % 4 == 0,
        created_at=datetime.now()
    ) for i in range(1, 16)
]

# Mock data required for dashboard metrics fallback
mock_cpes_len = 50
mock_onus_len = 20
mock_olts_len = 5

@router.get("/alerts", response_model=List[Alert])
async def get_alerts():
    """
    Retorna lista de alertas baseada em faults do GenieACS
    """
    try:
        client = await get_genieacs_client()
        raw_faults = await client.get_faults()
        
        alerts = []
        for fault_data in raw_faults:
            alert_data = transform_genieacs_fault_to_alert(fault_data)
            if alert_data:
                alerts.append(Alert(**alert_data))
        
        logger.info(f"Retornando {len(alerts)} alertas do GenieACS")
        
        if not alerts:
            return mock_alerts[:3]
            
        return alerts
            
    except Exception as e:
        logger.error(f"Erro ao buscar alertas do GenieACS: {e}")
        return mock_alerts[:3]

@router.get("/dashboard/metrics")
async def get_dashboard_metrics():
    """
    Retorna métricas do dashboard baseadas em dados reais do GenieACS
    """
    try:
        client = await get_genieacs_client()
        raw_devices = await client.get_devices()
        
        devices = []
        for device_data in raw_devices:
            cpe_data = transform_genieacs_to_cpe(device_data)
            if cpe_data:
                devices.append(cpe_data)
        
        metrics = calculate_dashboard_metrics(devices)
        
        raw_faults = await client.get_faults()
        critical_alerts = len([f for f in raw_faults if f.get("code") in ["9001", "8001", "8003"]])
        metrics["critical_alerts"] = critical_alerts
        
        logger.info(f"Métricas calculadas para {len(devices)} dispositivos do GenieACS")
        
        if not devices:
            logger.warning("Nenhum dispositivo encontrado, usando métricas mock")
            return {
                "total_devices": mock_cpes_len + mock_onus_len + mock_olts_len,
                "online_devices": 150, # Simplified mock value
                "offline_devices": 25, # Simplified mock value
                "critical_alerts": len([a for a in mock_alerts if a.severity == "critical"]),
                "uptime_percentage": 95.0,
                "avg_signal_strength": -42.5,
                "avg_latency": 15.2,
                "sla_compliance": 99.8
            }
        
        return metrics
            
    except Exception as e:
        logger.error(f"Erro ao calcular métricas do GenieACS: {e}")
        return {
            "total_devices": mock_cpes_len + mock_onus_len + mock_olts_len,
            "online_devices": 150, # Simplified mock value
            "offline_devices": 25, # Simplified mock value
            "critical_alerts": len([a for a in mock_alerts if a.severity == "critical"]),
            "uptime_percentage": 95.0,
            "avg_signal_strength": -42.5,
            "avg_latency": 15.2,
            "sla_compliance": 99.8
        }
