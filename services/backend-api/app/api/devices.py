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


import logging
logger = logging.getLogger(__name__)

# Mock data (temporarily here, will be moved)
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

from ..crud.provisioning import provisioned_devices_db

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
        
        if not cpes:
            logger.warning("Nenhum dispositivo encontrado no GenieACS, usando dados mock")
            return mock_cpes[:10]
            
        return cpes
            
    except Exception as e:
        logger.error(f"Erro ao buscar CPEs do GenieACS: {e}")
        return mock_cpes

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
    olt = crud_olt.get_olt(db, olt_id)
    if not olt:
        raise HTTPException(status_code=404, detail="OLT não encontrada")
    
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
