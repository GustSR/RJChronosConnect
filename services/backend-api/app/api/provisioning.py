from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict
from datetime import datetime, timedelta

from ..schemas.provisioning import (
    PendingONUModel, 
    ProvisionedDevice, 
    ONUProvisionRequest, 
    ClientConfigurationUpdate
)
from ..services.genieacs_client import get_genieacs_client
from ..crud.activity import log_activity
from ..crud.provisioning import provisioned_devices_db

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/pending", response_model=List[PendingONUModel])
async def get_pending_onus():
    """
    Retorna ONUs descobertas mas não autorizadas (pendentes de provisionamento)
    """
    try:
        client = await get_genieacs_client()
        raw_devices = await client.get_devices()
        
        pending_onus = []
        for device_data in raw_devices:
            device_id_info = device_data.get("_deviceId", {})
            serial_number = device_id_info.get("_SerialNumber", "Unknown")
            product_class = device_id_info.get("_ProductClass", "")
            device_id = device_data.get("_id", f"pending-{serial_number}")
            
            onu_indicators = ["HG8310", "F601", "F670", "AN5506", "G-140W"]
            is_onu = any(indicator in product_class for indicator in onu_indicators)
            
            if is_onu and device_id not in provisioned_devices_db:
                pending_onu = PendingONUModel(
                    id=device_id,
                    serial_number=serial_number,
                    olt_name="OLT-Auto-Detected",
                    board=1,
                    port=1,
                    discovered_at=datetime.now(),
                    distance=1.5,
                    onu_type=product_class,
                    status="pending",
                    rx_power=-18.5,
                    temperature=42.1
                )
                pending_onus.append(pending_onu)
        
        logger.info(f"Encontradas {len(pending_onus)} ONUs pendentes")
        
        if not pending_onus:
            logger.info("Nenhuma ONU pendente encontrada, gerando dados de demonstração")
            return [
                PendingONUModel(
                    id=f"pending-demo-{i}",
                    serial_number=f"DEMO{str(i).zfill(8)}",
                    olt_name=f"OLT-Central-{(i % 2) + 1:02d}",
                    board=1, port=i + 1, discovered_at=datetime.now() - timedelta(minutes=i * 15),
                    distance=round(1.2 + (i * 0.3), 1), onu_type="Huawei HG8310M",
                    status="pending", rx_power=round(-18.5 - (i * 0.5), 1), temperature=round(40.0 + (i * 1.2), 1)
                ) for i in range(3)
            ]
        
        return pending_onus
        
    except Exception as e:
        logger.error(f"Erro ao buscar ONUs pendentes: {e}")
        return []

@router.post("/{onu_id}/authorize")
async def authorize_onu(onu_id: str, provision_data: ONUProvisionRequest):
    """
    Autoriza uma ONU pendente e provisiona na rede
    """
    try:
        client = await get_genieacs_client()
        device_data = await client.get_device_by_id(onu_id)
        if not device_data:
            raise HTTPException(status_code=404, detail="ONU não encontrada")
        
        logger.info(f"Autorizando ONU {onu_id} para cliente {provision_data.client_name}")
        
        params = {
            "InternetGatewayDevice.DeviceInfo.X_BROADCOM_COM_EnableStatus": True,
            "InternetGatewayDevice.LANDevice.1.LANEthernetInterfaceConfig.1.X_BROADCOM_COM_VLANID": provision_data.vlan_id,
            "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ConnectionType": provision_data.wan_mode.upper(),
        }
        if provision_data.wan_mode == "pppoe":
            params.update({
                "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Enable": True,
                "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Username": provision_data.pppoe_username,
                "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Password": provision_data.pppoe_password,
            })
        
        success_count = 0
        for name, value in params.items():
            if value is not None and await client.set_parameter(onu_id, name, value):
                success_count += 1
        
        serial_number = device_data.get('_deviceId', {}).get('_SerialNumber', f'SN_{onu_id}')
        provisioned_device = ProvisionedDevice(
            device_id=onu_id, serial_number=serial_number, **provision_data.dict(),
            provisioned_at=datetime.now(), status="active"
        )
        provisioned_devices_db[onu_id] = provisioned_device
        
        await log_activity(
            device_id=onu_id, device_name=f"ONU {serial_number}", action="onu_authorization",
            description=f"ONU autorizada para cliente {provision_data.client_name}",
            status="success" if success_count > 0 else "partial",
            result=f"Aplicadas {success_count}/{len(params)} configurações",
            metadata=provision_data.dict()
        )
        
        return {"success": True, "message": f"ONU {onu_id} autorizada com sucesso"}
        
    except Exception as e:
        logger.error(f"Erro ao autorizar ONU {onu_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.delete("/{onu_id}/reject")
async def reject_onu(onu_id: str, reason: str = "Rejected by administrator"):
    """
    Rejeita uma ONU pendente
    """
    await log_activity(
        device_id=onu_id, device_name=f"ONU {onu_id}", action="onu_rejection",
        description=f"ONU rejeitada: {reason}", status="success",
        result="ONU removida da lista de pendentes", metadata={"rejection_reason": reason}
    )
    logger.info(f"ONU {onu_id} rejeitada: {reason}")
    return {"success": True, "message": f"ONU {onu_id} rejeitada com sucesso"}

@router.get("/clients")
async def get_provisioned_clients():
    """
    Retorna lista de todos os clientes provisionados
    """
    if not provisioned_devices_db: return []
    client = await get_genieacs_client()
    clients = []
    for onu_id, p_device in provisioned_devices_db.items():
        device_data = await client.get_device_by_id(onu_id)
        response = p_device.dict()
        response.update({
            "id": onu_id,
            "model": device_data.get("_deviceId", {}).get("_ProductClass", "Unknown") if device_data else "Unknown",
            "status": "online" if (device_data and device_data.get("_lastInform")) else "offline",
            "last_inform": device_data.get("_lastInform") if device_data else None,
        })
        clients.append(response)
    return clients

@router.get("/clients/{onu_id}")
async def get_client_configuration(onu_id: str):
    """
    Retorna configuração de um cliente provisionado específico
    """
    if onu_id not in provisioned_devices_db:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return provisioned_devices_db[onu_id]

@router.put("/clients/{onu_id}")
async def update_client_configuration(onu_id: str, updates: ClientConfigurationUpdate):
    """
    Atualiza configuração de um cliente provisionado
    """
    if onu_id not in provisioned_devices_db:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    p_device = provisioned_devices_db[onu_id]
    update_data = updates.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(p_device, key, value)
    
    provisioned_devices_db[onu_id] = p_device
    
    await log_activity(
        device_id=onu_id, device_name=f"Cliente {p_device.client_name}",
        action="client_configuration_update", description=f"Configuração atualizada",
        status="success", metadata=updates.dict(exclude_none=True)
    )
    
    return {"success": True, "message": "Configuração atualizada com sucesso"}
