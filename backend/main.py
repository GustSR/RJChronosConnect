from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import logging
import pytz

# Brazil timezone
BRAZIL_TZ = pytz.timezone('America/Sao_Paulo')

def get_brazil_now():
    """Get current datetime in Brazil timezone"""
    return datetime.now(BRAZIL_TZ)

# GenieACS integration imports
from genieacs_client import get_genieacs_client
from genieacs_transformers import (
    transform_genieacs_to_cpe,
    transform_genieacs_to_onu,
    transform_genieacs_fault_to_alert,
    calculate_dashboard_metrics,
    extract_wifi_config_from_device,
    create_wifi_parameter_updates,
    format_wifi_configs_for_frontend
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

class WiFiConfig(BaseModel):
    device_id: str
    ssid: str
    security: str
    password: Optional[str] = None
    band: Optional[str] = None
    channel: Optional[str] = None
    power: Optional[int] = None
    hidden: bool = False
    enabled: bool = True

class WiFiConfigUpdate(BaseModel):
    ssid: Optional[str] = None
    security: Optional[str] = None
    password: Optional[str] = None
    band: Optional[str] = None
    channel: Optional[str] = None
    power: Optional[int] = None
    hidden: Optional[bool] = None
    enabled: Optional[bool] = None

class ActivityLog(BaseModel):
    id: str
    device_id: Optional[str] = None
    device_name: Optional[str] = None
    action: str
    description: str
    executed_by: Optional[str] = None
    timestamp: datetime
    status: str
    duration: Optional[str] = None
    result: Optional[str] = None
    metadata: Optional[dict] = None

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

# Activity history data - now sourced from GenieACS
# TODO: Implement GenieACS integration for activity tracking

# Activity logging in-memory storage (temporary until GenieACS integration)
activity_history: List[ActivityLog] = []

async def log_activity(
    device_id: Optional[str],
    device_name: Optional[str], 
    action: str,
    description: str,
    executed_by: Optional[str] = "admin",
    status: str = "success",
    result: Optional[str] = None,
    metadata: Optional[dict] = None,
    serial_number: Optional[str] = None
):
    """
    Helper function to create activity log entries
    """
    try:
        brazil_now = get_brazil_now()
        activity = ActivityLog(
            id=f"activity-{int(brazil_now.timestamp())}-{len(activity_history)}",
            device_id=device_id,
            device_name=device_name or f"Device {device_id}" if device_id else "Sistema",
            action=action,
            description=description,
            executed_by=executed_by,
            timestamp=brazil_now,
            status=status,
            result=result,
            metadata=metadata,
            serialNumber=serial_number
        )
        
        # Add to in-memory storage (insert at beginning for newest first)
        activity_history.insert(0, activity)
        
        # Keep only last 100 activities to prevent memory issues
        if len(activity_history) > 100:
            activity_history[:] = activity_history[:100]
        
        logger.info(f"📝 Activity logged: {action} for {device_name or device_id}")
        return activity
        
    except Exception as e:
        logger.error(f"Error logging activity: {e}")
        return None

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 RJChronos Backend starting up...")
    
    # Add a test activity entry to show the system is working
    await log_activity(
        device_id="system",
        device_name="Sistema RJChronos", 
        action="system_startup",
        description="Sistema RJChronos iniciado com sucesso",
        executed_by=None,
        status="success",
        result="Sistema pronto para operação"
    )
    
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

# WiFi Configuration Endpoints
@app.get("/api/wifi/configs")
async def get_wifi_configs():
    """
    Retorna configurações WiFi de todos os dispositivos
    """
    try:
        client = await get_genieacs_client()
        raw_devices = await client.get_devices()
        
        wifi_configs = []
        for device_data in raw_devices:
            wifi_config = extract_wifi_config_from_device(device_data)
            if wifi_config:
                wifi_configs.append(wifi_config)
        
        formatted_data = format_wifi_configs_for_frontend(wifi_configs)
        
        logger.info(f"Retornando configurações WiFi de {len(wifi_configs)} dispositivos")
        return formatted_data
        
    except Exception as e:
        logger.error(f"Erro ao buscar configurações WiFi: {e}")
        # Fallback para dados mock em caso de erro
        return {
            "profiles": [],
            "devices": [],
            "stats": {
                "total_profiles": 0,
                "active_profiles": 0,
                "total_devices": 0,
                "online_devices": 0,
                "avg_signal": -50.0,
                "total_connections": 0
            }
        }

@app.get("/api/wifi/configs/{device_id}")
async def get_device_wifi_config(device_id: str, band: str = "2.4GHz"):
    """
    Retorna configuração WiFi de um dispositivo específico
    
    Args:
        device_id: ID do dispositivo
        band: Banda WiFi ("2.4GHz" ou "5GHz")
    """
    try:
        client = await get_genieacs_client()
        
        # PRIMEIRO: Força refresh dos parâmetros de senha WiFi
        logger.info(f"🔄 FORÇANDO REFRESH de senhas WiFi para {device_id} (banda {band})")
        await client.refresh_wifi_passwords(device_id)
        
        # Aguarda um pouco para o dispositivo processar o refresh
        import asyncio
        await asyncio.sleep(2)
        
        # AGORA: Busca os dados atualizados
        device_data = await client.get_device_by_id(device_id)
        
        if not device_data:
            raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
        
        wifi_config = extract_wifi_config_from_device(device_data, band)
        
        if not wifi_config:
            raise HTTPException(status_code=404, detail="Configuração WiFi não encontrada")
        
        return wifi_config
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar configuração WiFi do dispositivo {device_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.put("/api/wifi/configs/{device_id}")
async def update_device_wifi_config(device_id: str, updates: WiFiConfigUpdate, band: str = "2.4GHz"):
    """
    Atualiza configuração WiFi de um dispositivo
    
    Args:
        device_id: ID do dispositivo
        updates: Atualizações a serem aplicadas
        band: Banda WiFi ("2.4GHz" ou "5GHz")
    """
    try:
        client = await get_genieacs_client()
        
        # Verificar se dispositivo existe
        device_data = await client.get_device_by_id(device_id)
        if not device_data:
            raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
        
        # Converter updates para dict, removendo valores None
        update_dict = {k: v for k, v in updates.dict().items() if v is not None}
        
        logger.info(f"🎯 UPDATE WiFi REQUEST para dispositivo {device_id} (banda: {band}):")
        logger.info(f"   Updates raw: {updates.dict()}")
        logger.info(f"   Updates filtrados (sem None): {update_dict}")
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="Nenhuma atualização fornecida")
        
        # Criar tasks de atualização
        tasks = create_wifi_parameter_updates(device_id, update_dict, band)
        
        if not tasks:
            raise HTTPException(status_code=400, detail="Nenhuma task válida gerada")
        
        # Executar cada task via GenieACS
        success_count = 0
        for task in tasks:
            try:
                # Aplicar task no dispositivo
                if task["name"] == "setParameterValues":
                    for param_name, param_value in task["parameterValues"]:
                        success = await client.set_parameter(device_id, param_name, param_value)
                        if success:
                            success_count += 1
                        else:
                            logger.warning(f"Falha ao definir {param_name} = {param_value}")
            except Exception as task_error:
                logger.error(f"Erro ao executar task: {task_error}")
        
        if success_count == 0:
            raise HTTPException(status_code=500, detail="Falha ao aplicar configurações")
        
        # Retornar configuração atualizada
        logger.info(f"Aplicadas {success_count}/{len(tasks)} configurações WiFi no dispositivo {device_id}")
        
        # Log activity
        await log_activity(
            device_id=device_id,
            device_name=device_data.get("deviceId", {}).get("_value", device_id),
            action="wifi_config_update",
            description=f"Configurações WiFi atualizadas: {', '.join(update_dict.keys())}",
            executed_by="admin",
            status="success" if success_count > 0 else "failure",
            result=f"Aplicadas {success_count}/{len(tasks)} configurações com sucesso",
            metadata={
                "applied_updates": update_dict,
                "band": band,
                "tasks_executed": success_count,
                "total_tasks": len(tasks)
            },
            serial_number=device_data.get("device_id", {}).get("_value")
        )
        
        return {
            "success": True,
            "message": f"Configurações WiFi atualizadas ({success_count}/{len(tasks)} sucessos)",
            "applied_updates": update_dict,
            "tasks_executed": success_count,
            "total_tasks": len(tasks)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar configuração WiFi do dispositivo {device_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.post("/api/wifi/refresh/{device_id}")
async def refresh_device_wifi_config(device_id: str):
    """
    Força refresh das configurações WiFi de um dispositivo
    """
    try:
        client = await get_genieacs_client()
        
        # Verificar se dispositivo existe
        device_data = await client.get_device_by_id(device_id)
        if not device_data:
            raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
        
        # Executar summon imediato (como botão Summon do GenieACS UI)
        success = await client.summon_device(device_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Falha ao executar refresh")
        
        # Log activity
        await log_activity(
            device_id=device_id,
            device_name=device_data.get("deviceId", {}).get("_value", device_id),
            action="device_refresh",
            description="Refresh das configurações WiFi solicitado",
            executed_by="admin",
            status="success",
            result="Refresh executado com sucesso",
            serial_number=device_data.get("device_id", {}).get("_value")
        )

        return {
            "success": True,
            "message": "Refresh de configurações WiFi solicitado",
            "device_id": device_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao fazer refresh do dispositivo {device_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.post("/api/wifi/refresh-ip/{device_id}")
async def refresh_device_ip_parameters(device_id: str):
    """
    Força refresh dos parâmetros de IP de um dispositivo
    """
    try:
        client = await get_genieacs_client()
        
        # Verificar se dispositivo existe
        device_data = await client.get_device_by_id(device_id)
        if not device_data:
            raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
        
        # Executar refresh dos parâmetros IP
        success = await client.refresh_ip_parameters(device_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Falha ao executar refresh de IP")
        
        # Log activity
        await log_activity(
            device_id=device_id,
            device_name=device_data.get("deviceId", {}).get("_value", device_id),
            action="ip_refresh",
            description="Refresh dos parâmetros IP solicitado",
            executed_by="admin",
            status="success",
            result="Refresh de parâmetros IP executado com sucesso",
            serial_number=device_data.get("device_id", {}).get("_value")
        )

        return {
            "success": True,
            "message": "Refresh de parâmetros IP solicitado",
            "device_id": device_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao fazer refresh IP do dispositivo {device_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

# Activity History endpoints
@app.get("/api/activity-history", response_model=List[ActivityLog])
async def get_activity_history(
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    executed_by: Optional[str] = Query(None, description="Filter by executor"),
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    limit: Optional[int] = Query(50, description="Limit results"),
    offset: Optional[int] = Query(0, description="Offset for pagination")
):
    """
    Get activity history with optional filters
    
    TODO: Integrate with GenieACS to fetch real device activity history
    - Connect to GenieACS database/events
    - Track device parameter changes
    - Monitor device reboots and configuration updates
    - Extract serial numbers and device information
    """
    try:
        # Use in-memory activity history (temporary until GenieACS integration)
        logger.info(f"📋 Activity history request: {len(activity_history)} activities available")
        
        # Apply filters
        filtered_activities = activity_history.copy()
        
        if device_id:
            filtered_activities = [a for a in filtered_activities if a.device_id == device_id]
        if action:
            filtered_activities = [a for a in filtered_activities if a.action == action]
        if status:
            filtered_activities = [a for a in filtered_activities if a.status == status]
        if executed_by:
            filtered_activities = [a for a in filtered_activities if a.executed_by == executed_by]
        if date_from:
            filtered_activities = [a for a in filtered_activities if a.timestamp >= date_from]
        if date_to:
            filtered_activities = [a for a in filtered_activities if a.timestamp <= date_to]
        
        # Apply pagination
        total = len(filtered_activities)
        if offset:
            filtered_activities = filtered_activities[offset:]
        if limit:
            filtered_activities = filtered_activities[:limit]
        
        logger.info(f"📋 Returning {len(filtered_activities)} activities (total: {total})")
        return filtered_activities
        
    except Exception as e:
        logger.error(f"Error fetching activity history: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.get("/api/activity-history/{activity_id}", response_model=ActivityLog)
async def get_activity_by_id(activity_id: str):
    """
    Get specific activity by ID
    """
    try:
        # Search in in-memory activity history
        activity = next((a for a in activity_history if a.id == activity_id), None)
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        return activity
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching activity {activity_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.get("/api/activity-history/device/{device_id}", response_model=List[ActivityLog])
async def get_device_activity_history(
    device_id: str,
    limit: Optional[int] = Query(20, description="Limit results")
):
    """
    Get activity history for a specific device
    TODO: Implement GenieACS integration to fetch device activity history
    """
    try:
        # Filter activities for specific device
        device_activities = [a for a in activity_history if a.device_id == device_id]
        device_activities.sort(key=lambda x: x.timestamp, reverse=True)
        
        if limit:
            device_activities = device_activities[:limit]
        
        logger.info(f"📱 Device {device_id} activity history: {len(device_activities)} results")
        return device_activities
        
    except Exception as e:
        logger.error(f"Error fetching device {device_id} activity history: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.post("/api/activity-history", response_model=ActivityLog)
async def create_activity_log(activity: ActivityLog):
    """
    Create a new activity log entry
    TODO: Implement GenieACS integration to save activity logs
    """
    try:
        # TODO: Save activity to GenieACS or database
        brazil_now = get_brazil_now()
        activity.timestamp = brazil_now
        if not activity.id:
            activity.id = f"activity-temp-{int(brazil_now.timestamp())}"
        
        logger.info(f"📝 Activity log creation request: {activity.action} for device {activity.device_id} - GenieACS integration pending")
        return activity
        
    except Exception as e:
        logger.error(f"Error creating activity log: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.get("/api/activity-history/stats")
async def get_activity_stats():
    """
    Get activity statistics
    TODO: Implement GenieACS integration to fetch activity statistics
    """
    try:
        # Calculate statistics from in-memory activity history
        brazil_now = get_brazil_now()
        last_24h = brazil_now - timedelta(hours=24)
        last_7d = brazil_now - timedelta(days=7)
        
        stats = {
            "total_activities": len(activity_history),
            "last_24h": len([a for a in activity_history if a.timestamp >= last_24h]),
            "last_7d": len([a for a in activity_history if a.timestamp >= last_7d]),
            "by_status": {
                "success": len([a for a in activity_history if a.status == "success"]),
                "failure": len([a for a in activity_history if a.status == "failure"]),
                "pending": len([a for a in activity_history if a.status == "pending"]),
                "cancelled": len([a for a in activity_history if a.status == "cancelled"])
            },
            "by_action": {},
            "automated_vs_manual": {
                "automated": len([a for a in activity_history if a.executed_by is None]),
                "manual": len([a for a in activity_history if a.executed_by is not None])
            }
        }
        
        # Count by action type
        actions = set(a.action for a in activity_history)
        for action in actions:
            stats["by_action"][action] = len([a for a in activity_history if a.action == action])
        
        logger.info(f"📊 Activity stats: {stats['total_activities']} total activities")
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching activity stats: {e}")
        raise HTTPException(status_code=500, detail="Erro internal do servidor")


