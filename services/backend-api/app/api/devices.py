from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from ..schemas.device import CPE, ONU, DeviceResponse
from ..schemas.olt import OLT as OLTSchema
from ..services.genieacs_client import get_genieacs_client
from ..services.genieacs_transformers import transform_genieacs_to_cpe, transform_genieacs_to_onu
from ..services.olt_manager_client import delete_olt_manager
from ..database.database import get_db
from ..crud import olt as crud_olt
from ..crud import device as crud_device
from .helpers import ensure_olt_exists


import logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.delete("/onus/{device_id}")
async def delete_onu(device_id: int, db: Session = Depends(get_db)):
    """Deleta uma ONU do banco e da OLT."""
    device = crud_device.get_device(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
    
    # 1. Deletar da OLT
    if device.olt_port and device.ont_id is not None:
        olt = device.olt_port.olt
        port = device.olt_port
        
        # Path: /olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/onts/{ont_id}
        # frame padrao 0 se nao tiver
        path = f"/api/v1/olts/{olt.id}/ports/0/{port.slot}/{port.port_number}/onts/{device.ont_id}"
        
        # Chama delete
        response = await delete_olt_manager(path)
        if not response.get("success") and response.get("status") != "success":
             logger.warning(f"Falha ao deletar ONU da OLT: {response}")
             # Nao aborta, continua para deletar do banco
            
    # 2. Deletar do banco
    crud_device.delete_device(db, device_id)
    
    return {"success": True, "message": "ONU deletada com sucesso"}

@router.get("/cpes", response_model=List[CPE])
async def get_cpes():
    """
    Retorna lista de CPEs obtida do GenieACS
    """
    try:
        client = await get_genieacs_client()
        raw_devices = await client.get_devices()
        
        cpes = []
        for device_data in raw_devices:
            cpe_data = transform_genieacs_to_cpe(device_data)
            if cpe_data:
                cpes.append(CPE(**cpe_data))
        
        logger.info(f"Retornando {len(cpes)} CPEs do GenieACS")
        
        return cpes
            
    except Exception as e:
        logger.error(f"Erro ao buscar CPEs do GenieACS: {e}")
        return []

@router.get("/onus", response_model=List[DeviceResponse])
async def get_onus(db: Session = Depends(get_db)):
    """
    Retorna lista de ONUs APENAS provisionadas/autorizadas pelo sistema
    """
    onus = crud_device.get_devices(db)
    return onus

@router.get("/olts", response_model=List[OLTSchema])
async def get_olts(db: Session = Depends(get_db)):
    olts = crud_olt.get_olts(db)
    return olts

@router.get("/olts/{olt_id}/stats")
async def get_olt_stats(olt_id: int, db: Session = Depends(get_db)):
    """
    Retorna estatísticas de uma OLT específica
    """
    ensure_olt_exists(db, olt_id)
    
    devices = crud_device.get_devices(db)
    
    # This logic will need to be updated to correctly filter devices based on the OLT
    # For now, we will return some dummy data
    
    total_onus = len(devices)
    online_onus = len([d for d in devices if d.status_id == 1]) # Assuming 1 is the status for online
    offline_onus = total_onus - online_onus
    
    return {
        "total": total_onus,
        "online": online_onus,
        "offline": offline_onus
    }
