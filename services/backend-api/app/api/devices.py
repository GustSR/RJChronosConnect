from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from ..schemas.device import CPE, ONU, OLT
from ..services.genieacs_client import get_genieacs_client
from ..services.genieacs_transformers import transform_genieacs_to_cpe, transform_genieacs_to_onu
from ..database.database import get_db
from ..crud import olt as crud_olt
from ..crud import device as crud_device
from .helpers import ensure_olt_exists


import logging
logger = logging.getLogger(__name__)

router = APIRouter()

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

@router.get("/onus", response_model=List[ONU])
async def get_onus(db: Session = Depends(get_db)):
    """
    Retorna lista de ONUs APENAS provisionadas/autorizadas pelo sistema
    """
    onus = crud_device.get_devices(db)
    return onus

@router.get("/olts", response_model=List[OLT])
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
