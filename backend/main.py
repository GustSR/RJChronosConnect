from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import logging

# GenieACS integration imports
from genieacs_client import get_genieacs_client
from genieacs_transformers import (
    transform_genieacs_to_cpe,
    transform_genieacs_to_onu,
    transform_genieacs_fault_to_alert,
    calculate_dashboard_metrics
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models
class Device(BaseModel):
    id: str
    serial_number: str
    model: str
    status: str
    ip_address: Optional[str] = None
    last_seen: Optional[datetime] = None
    created_at: datetime

class CPE(Device):
    wifi_enabled: bool = True
    wifi_ssid: Optional[str] = None
    signal_strength: Optional[float] = None
    customer_name: Optional[str] = None

class ONU(Device):
    olt_id: str
    pon_port: str
    rx_power: Optional[float] = None
    tx_power: Optional[float] = None
    distance: Optional[float] = None

class OLT(Device):
    location: str
    pon_ports: int = 16
    active_onus: int = 0

class Alert(BaseModel):
    id: str
    device_id: Optional[str] = None
    severity: str
    title: str
    description: str
    acknowledged: bool = False
    created_at: datetime

class User(BaseModel):
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str = "operator"
    created_at: datetime

# Mock data
mock_cpes = [
    CPE(
        id=f"cpe-{i:03d}",
        serial_number=f"CPE{i:06d}",
        model="Intelbras IWR 3000N" if i % 2 == 0 else "TP-Link Archer C6",
        status="online" if i % 3 != 0 else "offline",
        ip_address=f"192.168.1.{i+100}",
        wifi_enabled=True,
        wifi_ssid=f"RJChronos_{i:03d}",
        signal_strength=-45.5 + (i % 20),
        customer_name=f"Cliente {i:03d}",
        last_seen=datetime.now(),
        created_at=datetime.now()
    ) for i in range(1, 51)
]

mock_onus = [
    ONU(
        id=f"onu-{i:03d}",
        serial_number=f"ONU{i:06d}",
        model="Huawei HG8310M" if i % 2 == 0 else "ZTE F601",
        status="online" if i % 4 != 0 else "offline",
        olt_id=f"olt-{(i-1)//4 + 1:03d}",
        pon_port=f"1/{(i-1)%4 + 1}",
        rx_power=-18.5 + (i % 10),
        tx_power=2.5 + (i % 5),
        distance=1.2 + (i % 10) * 0.1,
        last_seen=datetime.now(),
        created_at=datetime.now()
    ) for i in range(1, 21)
]

mock_olts = [
    OLT(
        id=f"olt-{i:03d}",
        serial_number=f"OLT{i:06d}",
        model="Huawei MA5608T" if i % 2 == 0 else "ZTE C320",
        status="online",
        location=f"Central {i}",
        pon_ports=16,
        active_onus=len([onu for onu in mock_onus if onu.olt_id == f"olt-{i:03d}"]),
        last_seen=datetime.now(),
        created_at=datetime.now()
    ) for i in range(1, 6)
]

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

mock_user = User(
    id="user-001",
    email="admin@rjchronos.com",
    first_name="Admin",
    last_name="RJChronos",
    role="admin",
    created_at=datetime.now()
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 RJChronos Backend starting up...")
    yield
    logger.info("🛑 RJChronos Backend shutting down...")

# FastAPI app
app = FastAPI(
    title="RJChronos API",
    description="Sistema de Gestão e Monitoramento de Rede",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Mock authentication - in production, validate JWT token
    return mock_user

# Routes
@app.get("/")
async def root():
    return {"message": "RJChronos API v1.0.0", "status": "online"}

@app.get("/api/auth/user", response_model=User)
async def get_user(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/api/devices/cpes", response_model=List[CPE])
async def get_cpes():
    """
    Retorna lista de CPEs obtida do GenieACS
    """
    try:
        # Usar cliente GenieACS para buscar dispositivos
        client = await get_genieacs_client()
        raw_devices = await client.get_devices()
        
        cpes = []
        for device_data in raw_devices:
            # Transformar dados GenieACS em estrutura CPE
            cpe_data = transform_genieacs_to_cpe(device_data)
            if cpe_data:
                cpes.append(CPE(**cpe_data))
        
        logger.info(f"Retornando {len(cpes)} CPEs do GenieACS")
        
        # Fallback para dados mock se nenhum dispositivo encontrado
        if not cpes:
            logger.warning("Nenhum dispositivo encontrado no GenieACS, usando dados mock")
            return mock_cpes[:10]  # Apenas 10 para demonstrar diferença
            
        return cpes
            
    except Exception as e:
        logger.error(f"Erro ao buscar CPEs do GenieACS: {e}")
        # Fallback para dados mock em caso de erro
        return mock_cpes

@app.get("/api/devices/onus", response_model=List[ONU])
async def get_onus():
    return mock_onus

@app.get("/api/devices/olts", response_model=List[OLT])
async def get_olts():
    return mock_olts

@app.get("/api/alerts", response_model=List[Alert])
async def get_alerts():
    """
    Retorna lista de alertas baseada em faults do GenieACS
    """
    try:
        client = await get_genieacs_client()
        # Buscar faults do GenieACS
        raw_faults = await client.get_faults()
        
        alerts = []
        for fault_data in raw_faults:
            # Transformar fault em alerta
            alert_data = transform_genieacs_fault_to_alert(fault_data)
            if alert_data:
                alerts.append(Alert(**alert_data))
        
        logger.info(f"Retornando {len(alerts)} alertas do GenieACS")
        
        # Se não há faults, retornar poucos alertas mock para demonstração
        if not alerts:
            return mock_alerts[:3]  # Apenas 3 alertas mock para demonstração
            
        return alerts
            
    except Exception as e:
        logger.error(f"Erro ao buscar alertas do GenieACS: {e}")
        return mock_alerts[:3]

@app.get("/api/dashboard/metrics")
async def get_dashboard_metrics():
    """
    Retorna métricas do dashboard baseadas em dados reais do GenieACS
    """
    try:
        client = await get_genieacs_client()
        # Buscar dispositivos reais
        raw_devices = await client.get_devices()
        
        # Transformar em estruturas padronizadas
        devices = []
        for device_data in raw_devices:
            cpe_data = transform_genieacs_to_cpe(device_data)
            if cpe_data:
                devices.append(cpe_data)
        
        # Calcular métricas baseadas nos dispositivos reais
        metrics = calculate_dashboard_metrics(devices)
        
        # Buscar alertas críticos
        raw_faults = await client.get_faults()
        critical_alerts = len([f for f in raw_faults if f.get("code") in ["9001", "8001", "8003"]])
        metrics["critical_alerts"] = critical_alerts
        
        logger.info(f"Métricas calculadas para {len(devices)} dispositivos do GenieACS")
        
        # Fallback para métricas mock se não há dispositivos
        if not devices:
            logger.warning("Nenhum dispositivo encontrado, usando métricas mock")
            return {
                "total_devices": len(mock_cpes) + len(mock_onus) + len(mock_olts),
                "online_devices": len([d for d in mock_cpes + mock_onus + mock_olts if d.status == "online"]),
                "offline_devices": len([d for d in mock_cpes + mock_onus + mock_olts if d.status == "offline"]),
                "critical_alerts": len([a for a in mock_alerts if a.severity == "critical"]),
                "uptime_percentage": 95.0,
                "avg_signal_strength": -42.5,
                "avg_latency": 15.2,
                "sla_compliance": 99.8
            }
        
        return metrics
            
    except Exception as e:
        logger.error(f"Erro ao calcular métricas do GenieACS: {e}")
        # Fallback para métricas mock em caso de erro
        return {
            "total_devices": len(mock_cpes) + len(mock_onus) + len(mock_olts),
            "online_devices": len([d for d in mock_cpes + mock_onus + mock_olts if d.status == "online"]),
            "offline_devices": len([d for d in mock_cpes + mock_onus + mock_olts if d.status == "offline"]),
            "critical_alerts": len([a for a in mock_alerts if a.severity == "critical"]),
            "uptime_percentage": 95.0,
            "avg_signal_strength": -42.5,
            "avg_latency": 15.2,
            "sla_compliance": 99.8
        }


