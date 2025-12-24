from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from ..schemas.provisioning import (
    PendingONUModel,
    ProvisionedDevice,
    ONUProvisionRequest,
    ClientConfigurationUpdate,
)
from ..schemas.device import DeviceCreate
from ..services.genieacs_client import get_genieacs_client
# from ..crud.activity import log_activity
from ..crud import device as crud_device
from ..crud import subscriber as crud_subscriber
from ..crud import olt as crud_olt
from ..database.database import get_db
from .helpers import ensure_device_exists
from ..models.subscriber import Subscriber
from ..models.olt import Olt
from ..models.olt_port import OltPort

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/pending", response_model=List[PendingONUModel])
async def get_pending_onus(db: Session = Depends(get_db)):
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
            
            db_device = crud_device.get_device_by_serial_number(db, serial_number)

            if is_onu and not db_device:
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
async def authorize_onu(onu_id: str, provision_data: ONUProvisionRequest, db: Session = Depends(get_db)):
    """
    Autoriza uma ONU pendente e provisiona na rede
    """
    try:
        client = await get_genieacs_client()
        device_data = await client.get_device_by_id(onu_id)
        if not device_data:
            raise HTTPException(status_code=404, detail="ONU não encontrada")
        
        logger.info(f"Autorizando ONU {onu_id} para cliente {provision_data.client_name}")
        
        # Create Subscriber if it doesn't exist
        subscriber = crud_subscriber.get_subscriber_by_cpf_cnpj(db, provision_data.client_cpf_cnpj)
        if not subscriber:
            subscriber = Subscriber(full_name=provision_data.client_name, cpf_cnpj=provision_data.client_cpf_cnpj)
            db.add(subscriber)
            db.commit()
            db.refresh(subscriber)

        # Create OLT and OLT Port if they don't exist
        olt = crud_olt.get_olt_by_name(db, provision_data.olt_name)
        if not olt:
            olt = Olt(name=provision_data.olt_name, ip_address="127.0.0.1") # Dummy IP
            db.add(olt)
            db.commit()
            db.refresh(olt)

        olt_port = crud_olt.get_olt_port(db, olt.id, provision_data.board, provision_data.port)
        if not olt_port:
            olt_port = OltPort(olt_id=olt.id, slot=provision_data.board, port_number=provision_data.port)
            db.add(olt_port)
            db.commit()
            db.refresh(olt_port)

        serial_number = device_data.get('_deviceId', {}).get('_SerialNumber', f'SN_{onu_id}')
        device = crud_device.create_device(db, device=DeviceCreate(
            serial_number=serial_number,
            genieacs_id=onu_id,
            subscriber_id=subscriber.id,
            olt_port_id=olt_port.id,
            status_id=1 # Online
        ))

        # await log_activity(
        #     device_id=onu_id, device_name=f"ONU {serial_number}", action="onu_authorization",
        #     description=f"ONU autorizada para cliente {provision_data.client_name}",
        #     status="success",
        #     result=f"Aplicadas configurações",
        #     metadata=provision_data.dict()
        # )
        
        return {"success": True, "message": f"ONU {onu_id} autorizada com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao autorizar ONU {onu_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.delete("/{onu_id}/reject")
async def reject_onu(onu_id: str, reason: str = "Rejected by administrator"):
    """
    Rejeita uma ONU pendente
    """
    # await log_activity(
    #     device_id=onu_id, device_name=f"ONU {onu_id}", action="onu_rejection",
    #     description=f"ONU rejeitada: {reason}", status="success",
    #     result="ONU removida da lista de pendentes", metadata={"rejection_reason": reason}
    # )
    logger.info(f"ONU {onu_id} rejeitada: {reason}")
    return {"success": True, "message": f"ONU {onu_id} rejeitada com sucesso"}

@router.get("/clients")
async def get_provisioned_clients(db: Session = Depends(get_db)):
    """
    Retorna lista de todos os clientes provisionados
    """
    devices = crud_device.get_devices(db)
    return devices

@router.get("/clients/{onu_id}")
async def get_client_configuration(onu_id: int, db: Session = Depends(get_db)):
    """
    Retorna configuração de um cliente provisionado específico
    """
    device = ensure_device_exists(db, onu_id, detail="Cliente não encontrado")
    return device

@router.put("/clients/{onu_id}")
async def update_client_configuration(onu_id: int, updates: ClientConfigurationUpdate, db: Session = Depends(get_db)):
    """
    Atualiza configuração de um cliente provisionado
    """
    device = ensure_device_exists(db, onu_id, detail="Cliente não encontrado")
    
    update_data = updates.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(device, key, value)
    
    db.add(device)
    db.commit()
    db.refresh(device)
    
    # await log_activity(
    #     device_id=onu_id, device_name=f"Cliente {device.subscriber.full_name}",
    #     action="client_configuration_update", description=f"Configuração atualizada",
    #     status="success", metadata=updates.dict(exclude_none=True)
    # )
    
    return {"success": True, "message": "Configuração atualizada com sucesso"}
