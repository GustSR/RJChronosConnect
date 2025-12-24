from fastapi import APIRouter, Depends
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session

from ..schemas.alert import Alert
from ..services.genieacs_client import get_genieacs_client
from ..services.genieacs_transformers import transform_genieacs_fault_to_alert, calculate_dashboard_metrics
from ..schemas.device import CPE, ONU, OLT # For mock data
from ..services.genieacs_transformers import transform_genieacs_to_cpe
from ..database.database import get_db
from ..crud import olt as crud_olt
from ..crud import device as crud_device
from ..crud import alert as crud_alert

import logging
logger = logging.getLogger(__name__)

router = APIRouter()


def _build_fallback_metrics(db: Session) -> dict:
    devices = crud_device.get_devices(db)
    olts = crud_olt.get_olts(db)
    total_devices = len(devices) + len(olts)
    online_devices = len([d for d in devices if d.status_id == 1]) + len(
        [o for o in olts if o.status_id == 1]
    )
    offline_devices = total_devices - online_devices
    return {
        "total_devices": total_devices,
        "online_devices": online_devices,
        "offline_devices": offline_devices,
        "critical_alerts": crud_alert.get_critical_alerts_count(db),
        "uptime_percentage": 95.0,
        "avg_signal_strength": -42.5,
        "avg_latency": 15.2,
        "sla_compliance": 99.8,
    }


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
        
        return alerts
            
    except Exception as e:
        logger.error(f"Erro ao buscar alertas do GenieACS: {e}")
        return []

@router.get("/dashboard/metrics")
async def get_dashboard_metrics(db: Session = Depends(get_db)):
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
            logger.warning("Nenhum dispositivo encontrado, usando métricas do banco de dados")
            return _build_fallback_metrics(db)
        
        return metrics
            
    except Exception as e:
        logger.error(f"Erro ao calcular métricas do GenieACS: {e}")
        return _build_fallback_metrics(db)
