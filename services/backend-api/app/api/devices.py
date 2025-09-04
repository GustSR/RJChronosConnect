from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime

from ..schemas.device import CPE, ONU, OLT
from ..services.genieacs_client import get_genieacs_client
from ..services.genieacs_transformers import transform_genieacs_to_cpe, transform_genieacs_to_onu

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
async def get_onus():
    """
    Retorna lista de ONUs APENAS provisionadas/autorizadas pelo sistema
    """
    try:
        if not provisioned_devices_db:
            logger.info("Nenhuma ONU provisionada encontrada")
            return []
        
        client = await get_genieacs_client()
        raw_devices = await client.get_devices()
        
        onus = []
        for device_data in raw_devices:
            device_id = device_data.get("_id", "")
            
            if device_id in provisioned_devices_db:
                onu_data = transform_genieacs_to_onu(device_data)
                if onu_data:
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
        return []

@router.get("/olts", response_model=List[OLT])
async def get_olts():
    return mock_olts

@router.get("/olts/{olt_id}/stats")
async def get_olt_stats(olt_id: str):
    """
    Retorna estatísticas de uma OLT específica
    """
    try:
        olt_exists = any(olt.id == olt_id for olt in mock_olts)
        if not olt_exists:
            raise HTTPException(status_code=404, detail="OLT não encontrada")
        
        provisioned_onus = [onu for onu in provisioned_devices_db.values()]
        mock_onus_for_olt = [onu for onu in mock_onus if onu.olt_id == olt_id]
        
        total_onus = len(provisioned_onus) + len(mock_onus_for_olt)
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