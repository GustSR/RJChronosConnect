from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
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
    logger.info("RJChronos Backend starting up...")
    
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
    """
    Retorna lista de ONUs APENAS provisionadas/autorizadas pelo sistema
    """
    try:
        # Se não há dispositivos provisionados, retornar lista vazia
        if not provisioned_devices_db:
            logger.info("Nenhuma ONU provisionada encontrada")
            return []
        
        client = await get_genieacs_client()
        raw_devices = await client.get_devices()
        
        onus = []
        for device_data in raw_devices:
            device_id = device_data.get("_id", "")
            
            # Verificar se este dispositivo foi provisionado pelo nosso sistema
            if device_id in provisioned_devices_db:
                onu_data = transform_genieacs_to_onu(device_data)
                if onu_data:
                    # Enriquecer com dados de provisionamento
                    provisioned_info = provisioned_devices_db[device_id]
                    onu_data.update({
                        "customer_name": provisioned_info.client_name,
                        "customer_address": provisioned_info.client_address,
                        "service_profile": provisioned_info.service_profile,
                        "vlan_id": provisioned_info.vlan_id,
                        "wan_mode": provisioned_info.wan_mode,
                        "comment": provisioned_info.comment,
                        "provisioned_at": provisioned_info.provisioned_at.isoformat(),
                        "provisioned_by": provisioned_info.provisioned_by
                    })
                    onus.append(ONU(**onu_data))
        
        logger.info(f"Retornando {len(onus)} ONUs provisionadas pelo sistema")
        return onus
            
    except Exception as e:
        logger.error(f"Erro ao buscar ONUs provisionadas: {e}")
        # Retornar lista vazia em caso de erro
        return []

@app.get("/api/devices/olts", response_model=List[OLT])
async def get_olts():
    return mock_olts

@app.get("/api/devices/olts/{olt_id}/stats")
async def get_olt_stats(olt_id: str):
    """
    Retorna estatísticas de uma OLT específica
    """
    try:
        # Verificar se a OLT existe
        olt_exists = any(olt.id == olt_id for olt in mock_olts)
        if not olt_exists:
            raise HTTPException(status_code=404, detail="OLT não encontrada")
        
        # Contar ONUs conectadas a essa OLT
        # Primeiro, buscar ONUs provisionadas que estão conectadas a essa OLT
        provisioned_onus = [onu for onu in provisioned_devices_db.values()]
        
        # Para ONUs mock, filtrar por olt_id
        mock_onus_for_olt = [onu for onu in mock_onus if onu.olt_id == olt_id]
        
        # Combinar dados reais e mock para estatísticas
        total_onus = len(provisioned_onus) + len(mock_onus_for_olt)
        
        # Assumir que ONUs provisionadas estão online, mock_onus usar o status
        online_onus = len(provisioned_onus) + len([onu for onu in mock_onus_for_olt if onu.status == "online"])
        offline_onus = total_onus - online_onus
        
        return {
            "total": total_onus,
            "online": online_onus,
            "offline": offline_onus
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas da OLT {olt_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

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

# ONU Provisioning Endpoints
class PendingONUModel(BaseModel):
    id: str
    serial_number: str
    olt_name: str
    board: int
    port: int
    discovered_at: datetime
    distance: Optional[float] = None
    onu_type: str
    status: str = "pending"
    rx_power: Optional[float] = None
    temperature: Optional[float] = None

# Modelo para rastrear dispositivos provisionados
class ProvisionedDevice(BaseModel):
    device_id: str
    serial_number: str
    client_name: str
    client_address: str
    service_profile: str
    vlan_id: int
    wan_mode: str
    pppoe_username: Optional[str] = None
    pppoe_password: Optional[str] = None
    provisioned_at: datetime
    provisioned_by: str = "admin"
    status: str = "active"
    comment: Optional[str] = None

class ONUProvisionRequest(BaseModel):
    client_name: str
    client_address: str
    service_profile: str = "default"
    vlan_id: Optional[int] = 100
    wan_mode: str = "dhcp"  # dhcp, pppoe, static
    pppoe_username: Optional[str] = None
    pppoe_password: Optional[str] = None
    comment: Optional[str] = None

# Base de dados em memória para dispositivos provisionados (em produção seria banco de dados)
provisioned_devices_db: Dict[str, ProvisionedDevice] = {}

@app.get("/api/provisioning/pending", response_model=List[PendingONUModel])
async def get_pending_onus():
    """
    Retorna ONUs descobertas mas não autorizadas (pendentes de provisionamento)
    """
    try:
        client = await get_genieacs_client()
        raw_devices = await client.get_devices()
        
        # Filtrar apenas dispositivos que parecem ser ONUs não autorizadas
        pending_onus = []
        
        for device_data in raw_devices:
            device_id_info = device_data.get("_deviceId", {})
            serial_number = device_id_info.get("_SerialNumber", "Unknown")
            product_class = device_id_info.get("_ProductClass", "")
            device_id = device_data.get("_id", f"pending-{serial_number}")
            
            # Identificar ONUs baseado no ProductClass ou outros indicadores
            onu_indicators = ["HG8310", "F601", "F670", "AN5506", "G-140W"]
            is_onu = any(indicator in product_class for indicator in onu_indicators)
            
            if is_onu:
                # Verificar se já foi provisionada
                if device_id in provisioned_devices_db:
                    logger.debug(f"ONU {serial_number} já provisionada, pulando")
                    continue
                
                # Apenas ONUs NÃO provisionadas são consideradas pendentes
                last_inform = device_data.get("_lastInform")
                
                # Critérios mais específicos para ONUs "descobertas" mas não autorizadas:
                # 1. Tem last_inform (está comunicando com GenieACS)
                # 2. Não está na nossa base de provisionados
                # 3. Pode ter sido descoberta recentemente
                
                pending_onu = PendingONUModel(
                    id=device_id,
                    serial_number=serial_number,
                    olt_name="OLT-Auto-Detected",  # Seria detectado pela rede
                    board=1,  # Seria detectado automaticamente
                    port=1,   # Seria detectado automaticamente
                    discovered_at=datetime.now(),
                    distance=1.5,  # Simulado
                    onu_type=product_class,
                    status="pending",
                    rx_power=-18.5,
                    temperature=42.1
                )
                pending_onus.append(pending_onu)
        
        logger.info(f"Encontradas {len(pending_onus)} ONUs pendentes")
        
        # Se não há ONUs pendentes reais, retornar algumas simuladas para demonstração
        if not pending_onus:
            logger.info("Nenhuma ONU pendente encontrada, gerando dados de demonstração")
            mock_pending = [
                PendingONUModel(
                    id=f"pending-demo-{i}",
                    serial_number=f"DEMO{str(i).zfill(8)}",
                    olt_name=f"OLT-Central-{(i % 2) + 1:02d}",
                    board=1,
                    port=i + 1,
                    discovered_at=datetime.now() - timedelta(minutes=i * 15),
                    distance=round(1.2 + (i * 0.3), 1),
                    onu_type="Huawei HG8310M" if i % 2 == 0 else "ZTE F601",
                    status="pending",
                    rx_power=round(-18.5 - (i * 0.5), 1),
                    temperature=round(40.0 + (i * 1.2), 1)
                ) for i in range(3)
            ]
            return mock_pending
        
        return pending_onus
        
    except Exception as e:
        logger.error(f"Erro ao buscar ONUs pendentes: {e}")
        # Retornar dados de demonstração em caso de erro
        return [
            PendingONUModel(
                id="pending-error-demo",
                serial_number="ERROR12345678",
                olt_name="OLT-Error-Demo",
                board=1,
                port=1,
                discovered_at=datetime.now(),
                distance=1.5,
                onu_type="Demo Error",
                status="pending",
                rx_power=-20.0,
                temperature=45.0
            )
        ]

@app.post("/api/provisioning/{onu_id}/authorize")
async def authorize_onu(onu_id: str, provision_data: ONUProvisionRequest):
    """
    Autoriza uma ONU pendente e provisiona na rede
    """
    try:
        client = await get_genieacs_client()
        
        # Buscar dados da ONU pendente
        device_data = await client.get_device_by_id(onu_id)
        if not device_data:
            raise HTTPException(status_code=404, detail="ONU não encontrada")
        
        logger.info(f"Autorizando ONU {onu_id} para cliente {provision_data.client_name}")
        
        # Definir parâmetros básicos de autorização via TR-069
        # Estes parâmetros dependem do modelo da ONU e da sua infraestrutura
        authorization_params = {
            # Habilitar ONU na OLT
            "InternetGatewayDevice.DeviceInfo.X_BROADCOM_COM_EnableStatus": True,
            
            # Configurar VLAN se especificada
            "InternetGatewayDevice.LANDevice.1.LANEthernetInterfaceConfig.1.X_BROADCOM_COM_VLANID": provision_data.vlan_id,
            
            # Configurar modo WAN baseado no solicitado
            "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ConnectionType": provision_data.wan_mode.upper(),
        }
        
        # Se for PPPoE, configurar credenciais (se fornecidas)
        if provision_data.wan_mode == "pppoe":
            authorization_params.update({
                "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Enable": True,
            })
            
            # Adicionar credenciais PPPoE se fornecidas
            if provision_data.pppoe_username:
                authorization_params["InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Username"] = provision_data.pppoe_username
            
            if provision_data.pppoe_password:
                authorization_params["InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Password"] = provision_data.pppoe_password
        
        # Aplicar configurações via TR-069
        success_count = 0
        for param_name, param_value in authorization_params.items():
            try:
                success = await client.set_parameter(onu_id, param_name, param_value)
                if success:
                    success_count += 1
            except Exception as param_error:
                logger.warning(f"Falha ao configurar {param_name}: {param_error}")
        
        # Registrar dispositivo como provisionado
        serial_number = device_data.get('_deviceId', {}).get('_SerialNumber', f'SN_{onu_id}')
        provisioned_device = ProvisionedDevice(
            device_id=onu_id,
            serial_number=serial_number,
            client_name=provision_data.client_name,
            client_address=provision_data.client_address,
            service_profile=provision_data.service_profile,
            vlan_id=provision_data.vlan_id or 100,
            wan_mode=provision_data.wan_mode,
            pppoe_username=provision_data.pppoe_username,
            pppoe_password=provision_data.pppoe_password,
            provisioned_at=datetime.now(),
            provisioned_by="admin",
            status="active",
            comment=provision_data.comment
        )
        
        # Salvar na "base de dados" (em memória)
        provisioned_devices_db[onu_id] = provisioned_device
        
        # Log da atividade
        await log_activity(
            device_id=onu_id,
            device_name=f"ONU {serial_number}",
            action="onu_authorization",
            description=f"ONU autorizada para cliente {provision_data.client_name}",
            executed_by="admin",
            status="success" if success_count > 0 else "partial",
            result=f"Aplicadas {success_count}/{len(authorization_params)} configurações",
            metadata={
                "client_name": provision_data.client_name,
                "client_address": provision_data.client_address,
                "service_profile": provision_data.service_profile,
                "vlan_id": provision_data.vlan_id,
                "wan_mode": provision_data.wan_mode
            }
        )
        
        return {
            "success": True,
            "message": f"ONU {onu_id} autorizada com sucesso para {provision_data.client_name}",
            "provisioned_client": {
                "onu_id": onu_id,
                "client_name": provision_data.client_name,
                "client_address": provision_data.client_address,
                "service_profile": provision_data.service_profile,
                "configurations_applied": success_count,
                "authorized_at": datetime.now().isoformat()
            },
            # ID para redirecionamento imediato para configuração
            "redirect_to_config": f"/dashboard/clientes/{onu_id}/configurar"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao autorizar ONU {onu_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.delete("/api/provisioning/{onu_id}/reject")
async def reject_onu(onu_id: str, reason: str = "Rejected by administrator"):
    """
    Rejeita uma ONU pendente
    """
    try:
        # Log da atividade de rejeição
        await log_activity(
            device_id=onu_id,
            device_name=f"ONU {onu_id}",
            action="onu_rejection",
            description=f"ONU rejeitada: {reason}",
            executed_by="admin",
            status="success",
            result="ONU removida da lista de pendentes",
            metadata={"rejection_reason": reason}
        )
        
        # Em um cenário real, você pode querer:
        # 1. Bloquear o dispositivo no GenieACS
        # 2. Adicionar à lista negra
        # 3. Enviar comandos para desconectar
        
        logger.info(f"ONU {onu_id} rejeitada: {reason}")
        
        return {
            "success": True,
            "message": f"ONU {onu_id} rejeitada com sucesso",
            "reason": reason,
            "rejected_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Erro ao rejeitar ONU {onu_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.get("/api/provisioning/clients")
async def get_provisioned_clients():
    """
    Retorna lista de todos os clientes provisionados preservando dados salvos
    """
    try:
        if not provisioned_devices_db:
            logger.info("📋 Nenhum cliente provisionado encontrado")
            return []
        
        client = await get_genieacs_client()
        provisioned_clients = []
        
        for onu_id, provisioned_device in provisioned_devices_db.items():
            logger.info(f"Processando cliente provisionado {onu_id}:")
            logger.info(f"  📋 Nome: {provisioned_device.client_name}")
            logger.info(f"  🏠 Endereço: {provisioned_device.client_address}")
            logger.info(f"  💬 Comentário: {provisioned_device.comment}")
            
            # Buscar dados atuais do GenieACS para status/monitoramento
            device_data = await client.get_device_by_id(onu_id)
            
            # Construir resposta preservando dados salvos
            client_response = {
                "id": onu_id,
                "serial_number": provisioned_device.serial_number,
                "model": device_data.get("_deviceId", {}).get("_ProductClass", "Unknown") if device_data else "Unknown",
                "olt_id": "olt-001",  # Seria extraído dos dados reais
                "pon_port": "1/1",    # Seria extraído dos dados reais
                "status": "online" if (device_data and device_data.get("_lastInform")) else "offline",
                "rx_power": -18.5,    # Seria extraído dos dados reais
                "tx_power": 2.5,      # Seria extraído dos dados reais
                "distance": 1.2,      # Seria extraído dos dados reais
                "last_inform": device_data.get("_lastInform") if device_data else None,
                "created_at": device_data.get("_registered") if device_data else provisioned_device.provisioned_at.isoformat(),
                
                # Dados salvos - preservar sempre
                "customer_name": provisioned_device.client_name,
                "customer_address": provisioned_device.client_address,
                "service_profile": provisioned_device.service_profile,
                "vlan_id": provisioned_device.vlan_id,
                "wan_mode": provisioned_device.wan_mode,
                "comment": provisioned_device.comment,
                "provisioned_at": provisioned_device.provisioned_at.isoformat(),
                "provisioned_by": provisioned_device.provisioned_by,
            }
            
            provisioned_clients.append(client_response)
        
        logger.info(f"Retornando {len(provisioned_clients)} clientes provisionados com dados preservados")
        return provisioned_clients
        
    except Exception as e:
        logger.error(f"Erro ao buscar clientes provisionados: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

# Client Configuration Endpoints
class ClientConfigurationUpdate(BaseModel):
    client_name: Optional[str] = None
    client_address: Optional[str] = None
    service_profile: Optional[str] = None
    vlan_id: Optional[int] = None
    wan_mode: Optional[str] = None
    pppoe_username: Optional[str] = None
    pppoe_password: Optional[str] = None
    comment: Optional[str] = None

@app.get("/api/clients/{onu_id}")
async def get_client_configuration(onu_id: str):
    """
    Retorna configuração de um cliente provisionado específico
    """
    try:
        # Verificar se o dispositivo foi provisionado
        if onu_id not in provisioned_devices_db:
            raise HTTPException(status_code=404, detail="Cliente não encontrado")
        
        provisioned_device = provisioned_devices_db[onu_id]
        
        logger.info(f"Carregando cliente {onu_id}:")
        logger.info(f"  📋 Nome: {provisioned_device.client_name}")
        logger.info(f"  🏠 Endereço: {provisioned_device.client_address}")
        logger.info(f"  💬 Comentário: {provisioned_device.comment}")
        
        # Buscar dados atuais do GenieACS
        client = await get_genieacs_client()
        device_data = await client.get_device_by_id(onu_id)
        
        if device_data:
            # Construir resposta com dados salvos (não usar transform que sobrescreve)
            device_id_info = device_data.get("_deviceId", {})
            response_data = {
                "id": onu_id,
                "serial_number": device_id_info.get("_SerialNumber", provisioned_device.serial_number),
                "model": device_id_info.get("_ProductClass", "Unknown"),
                "olt_id": "olt-001",  # Seria extraído dos dados reais
                "pon_port": "1/1",    # Seria extraído dos dados reais
                "status": "online" if device_data.get("_lastInform") else "offline",
                "rx_power": -18.5,    # Seria extraído dos dados reais
                "tx_power": 2.5,      # Seria extraído dos dados reais
                "distance": 1.2,      # Seria extraído dos dados reais
                "last_seen": device_data.get("_lastInform"),
                "created_at": device_data.get("_registered", provisioned_device.provisioned_at.isoformat()),
                
                # Dados salvos - não sobrescrever
                "customer_name": provisioned_device.client_name,
                "customer_address": provisioned_device.client_address,
                "service_profile": provisioned_device.service_profile,
                "vlan_id": provisioned_device.vlan_id,
                "wan_mode": provisioned_device.wan_mode,
                "pppoe_username": provisioned_device.pppoe_username,
                "pppoe_password": provisioned_device.pppoe_password,
                "comment": provisioned_device.comment,
                "provisioned_at": provisioned_device.provisioned_at.isoformat(),
                "provisioned_by": provisioned_device.provisioned_by,
                
                "_genieacs_metadata": {
                    "manufacturer": device_id_info.get("_Manufacturer", "Unknown"),
                    "oui": device_id_info.get("_OUI", ""),
                    "product_class": device_id_info.get("_ProductClass", ""),
                    "last_inform_raw": device_data.get("_lastInform")
                }
            }
            return response_data
        
        # Fallback para dados provisionados apenas
        return {
            "id": onu_id,
            "serial_number": provisioned_device.serial_number,
            "customer_name": provisioned_device.client_name,
            "customer_address": provisioned_device.client_address,
            "service_profile": provisioned_device.service_profile,
            "vlan_id": provisioned_device.vlan_id,
            "wan_mode": provisioned_device.wan_mode,
            "pppoe_username": provisioned_device.pppoe_username,
            "pppoe_password": provisioned_device.pppoe_password,
            "comment": provisioned_device.comment,
            "provisioned_at": provisioned_device.provisioned_at.isoformat(),
            "provisioned_by": provisioned_device.provisioned_by,
            "status": "offline"  # Se não conseguiu dados do GenieACS
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar configuração do cliente {onu_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.put("/api/clients/{onu_id}")
async def update_client_configuration(onu_id: str, updates: ClientConfigurationUpdate):
    """
    Atualiza configuração de um cliente provisionado
    """
    logger.info(f"🏠🏠🏠 ENDPOINT CLIENT CHAMADO: PUT /api/clients/{onu_id}")
    logger.info(f"🏠🏠🏠 DADOS RECEBIDOS: {updates}")
    
    try:
        # Verificar se o dispositivo foi provisionado
        if onu_id not in provisioned_devices_db:
            raise HTTPException(status_code=404, detail="Cliente não encontrado")
        
        # Atualizar dados na base local
        provisioned_device = provisioned_devices_db[onu_id]
        
        if updates.client_name is not None:
            provisioned_device.client_name = updates.client_name
        if updates.client_address is not None:
            provisioned_device.client_address = updates.client_address
        if updates.service_profile is not None:
            provisioned_device.service_profile = updates.service_profile
        if updates.vlan_id is not None:
            provisioned_device.vlan_id = updates.vlan_id
        if updates.wan_mode is not None:
            provisioned_device.wan_mode = updates.wan_mode
        if updates.pppoe_username is not None:
            provisioned_device.pppoe_username = updates.pppoe_username
        if updates.pppoe_password is not None:
            provisioned_device.pppoe_password = updates.pppoe_password
        if updates.comment is not None:
            provisioned_device.comment = updates.comment
        
        # Salvar de volta na base
        provisioned_devices_db[onu_id] = provisioned_device
        
        logger.info(f"💾 Cliente {onu_id} atualizado:")
        logger.info(f"  📋 Nome: {provisioned_device.client_name}")
        logger.info(f"  🏠 Endereço: {provisioned_device.client_address}")
        logger.info(f"  🌐 WAN Mode: {provisioned_device.wan_mode}")
        if provisioned_device.wan_mode == "pppoe":
            logger.info(f"  👤 PPPoE User: {provisioned_device.pppoe_username}")
            logger.info(f"  🔐 PPPoE Pass: {'***' if provisioned_device.pppoe_password else 'Not set'}")
        logger.info(f"  💬 Comentário: {provisioned_device.comment}")
        
        # Aplicar mudanças via TR-069 se necessário
        client = await get_genieacs_client()
        config_updates = {}
        
        if updates.vlan_id is not None:
            config_updates["InternetGatewayDevice.LANDevice.1.LANEthernetInterfaceConfig.1.X_BROADCOM_COM_VLANID"] = updates.vlan_id
        
        if updates.wan_mode is not None:
            config_updates["InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ConnectionType"] = updates.wan_mode.upper()
        
        # Se for PPPoE e temos credenciais, configurar parâmetros específicos
        if updates.wan_mode == "pppoe" or (provisioned_device.wan_mode == "pppoe" and (updates.pppoe_username is not None or updates.pppoe_password is not None)):
            config_updates["InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Enable"] = True
            
            if updates.pppoe_username is not None:
                config_updates["InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Username"] = updates.pppoe_username
            
            if updates.pppoe_password is not None:
                config_updates["InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Password"] = updates.pppoe_password
        
        # Aplicar configurações TR-069
        success_count = 0
        for param_name, param_value in config_updates.items():
            try:
                success = await client.set_parameter(onu_id, param_name, param_value)
                if success:
                    success_count += 1
            except Exception as param_error:
                logger.warning(f"Falha ao aplicar {param_name}: {param_error}")
        
        # Log da atividade
        await log_activity(
            device_id=onu_id,
            device_name=f"Cliente {provisioned_device.client_name}",
            action="client_configuration_update",
            description=f"Configuração atualizada",
            executed_by="admin",
            status="success",
            result=f"Dados salvos, {success_count} configurações TR-069 aplicadas",
            metadata=updates.dict(exclude_none=True)
        )
        
        return {
            "success": True,
            "message": "Configuração atualizada com sucesso",
            "tr069_updates_applied": success_count,
            "updated_fields": list(updates.dict(exclude_none=True).keys())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar configuração do cliente {onu_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

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
        logger.info(f"FORÇANDO REFRESH de senhas WiFi para {device_id} (banda {band})")
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

@app.post("/api/device/refresh-wifi")
async def refresh_device_wifi(device_id: str = Query(...)):
    """
    Forçar refresh das configurações WiFi de um dispositivo via TR-069
    """
    try:
        logger.info(f"Iniciando refresh WiFi para dispositivo: {device_id}")
        
        # Obter cliente GenieACS
        client = await get_genieacs_client()
        
        # Verificar se o dispositivo existe e está online
        device_data = await client.get_device_by_id(device_id)
        if not device_data:
            raise HTTPException(status_code=404, detail=f"Dispositivo {device_id} não encontrado")
        
        # Verificar última comunicação do dispositivo
        last_inform = device_data.get('_lastInform')
        if last_inform:
            last_inform_time = datetime.fromisoformat(last_inform.replace('Z', '+00:00'))
            time_diff = datetime.now(timezone.utc) - last_inform_time
            logger.info(f"📡 Última comunicação há {time_diff.total_seconds():.1f} segundos")
            
            if time_diff.total_seconds() > 300:  # 5 minutos
                logger.warning(f"Dispositivo pode estar offline - última comunicação há {time_diff.total_seconds():.1f} segundos")
        
        # Criar tarefas de refresh para WiFi 2.4GHz e 5GHz
        refresh_tasks = []
        
        # Parâmetros WiFi para refresh
        wifi_params = [
            # WiFi 2.4GHz
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID",
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase",
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase",
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Enable",
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.BeaconType",
            # WiFi 5GHz
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.SSID",
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.PreSharedKey.1.KeyPassphrase",
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.KeyPassphrase",
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.Enable",
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.BeaconType"
        ]
        
        # Criar tarefa de getParameterValues para todos os parâmetros
        task_data = {
            "name": "getParameterValues",
            "parameterNames": wifi_params
        }
        
        task_result = await client.add_task(device_id, task_data)
        if task_result:
            refresh_tasks.append(task_result)
            logger.info(f"📝 Tarefa de refresh criada com ID: {task_result.get('_id')}")
        
        # Tentar fazer connection request para forçar comunicação imediata
        try:
            connection_result = await client.connection_request(device_id)
            logger.info(f"📞 Connection request enviado: {connection_result}")
        except Exception as conn_error:
            logger.warning(f"Erro ao enviar connection request: {conn_error}")
        
        logger.info(f"Refresh WiFi iniciado para dispositivo {device_id}")
        
        return {
            "success": True,
            "message": f"Refresh WiFi iniciado para dispositivo {device_id}",
            "device_id": device_id,
            "tasks_created": len(refresh_tasks),
            "last_inform": last_inform
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao fazer refresh WiFi: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.put("/api/wifi/configs/{device_id}")
async def update_device_wifi_config(device_id: str, updates: WiFiConfigUpdate, band: str = Query("2.4GHz")):
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
        
        # Verificar status do dispositivo
        import time
        
        # Verificar se device_data é um dicionário válido
        if not isinstance(device_data, dict):
            device_status = 0
            time_since_last_inform = 0
        else:
            # Verificar _lastInform
            last_inform_data = device_data.get("_lastInform", {})
            
            if isinstance(last_inform_data, dict):
                device_status = last_inform_data.get("_timestamp", 0)
            else:
                device_status = 0
            
            current_time = time.time() * 1000  # timestamp em ms
            time_since_last_inform = current_time - device_status
            
        # Se dispositivo não se comunicou nas últimas 24 horas, avisar
        if time_since_last_inform > 24 * 60 * 60 * 1000:
            logger.warning(f"Dispositivo {device_id} pode estar offline - último inform há {time_since_last_inform/1000/60:.1f} minutos")
        
        # Converter updates para dict, removendo valores None
        update_dict = {k: v for k, v in updates.dict().items() if v is not None}
        
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


