from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import logging

# Import schemas and services
from app.schemas.device import CPE, ONU, OLT
from app.services.genieacs_client import get_genieacs_client
from app.services.genieacs_transformers import transform_genieacs_to_cpe

# Logger
logger = logging.getLogger(__name__)

# APIRouter
router = APIRouter()

# Mock data (will be moved or replaced later)
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
async def get_onus():
    return mock_onus

@router.get("/olts", response_model=List[OLT])
async def get_olts():
    return mock_olts
