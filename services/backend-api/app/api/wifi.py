from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional

from ..schemas.wifi import WiFiConfig, WiFiConfigUpdate
from ..services.genieacs_client import get_genieacs_client
from ..services.genieacs_transformers import (
    extract_wifi_config_from_device,
    create_wifi_parameter_updates,
    format_wifi_configs_for_frontend
)
from ..crud.activity import log_activity # Assuming log_activity will be in crud

import logging
import asyncio
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/configs", response_model=dict)
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
        return {"profiles": [], "devices": [], "stats": {}}

@router.get("/configs/{device_id}", response_model=WiFiConfig)
async def get_device_wifi_config(device_id: str, band: str = "2.4GHz"):
    """
    Retorna configuração WiFi de um dispositivo específico
    """
    try:
        client = await get_genieacs_client()
        await client.refresh_wifi_passwords(device_id)
        await asyncio.sleep(2)
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

@router.put("/configs/{device_id}")
async def update_device_wifi_config(device_id: str, updates: WiFiConfigUpdate, band: str = Query("2.4GHz")):
    """
    Atualiza configuração WiFi de um dispositivo
    """
    try:
        client = await get_genieacs_client()
        device_data = await client.get_device_by_id(device_id)
        if not device_data:
            raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
        
        update_dict = updates.dict(exclude_unset=True)
        if not update_dict:
            raise HTTPException(status_code=400, detail="Nenhuma atualização fornecida")
        
        tasks = create_wifi_parameter_updates(device_id, update_dict, band)
        success_count = 0
        for task in tasks:
            if task["name"] == "setParameterValues":
                for param_name, param_value in task["parameterValues"]:
                    if await client.set_parameter(device_id, param_name, param_value):
                        success_count += 1
        
        if success_count == 0:
            raise HTTPException(status_code=500, detail="Falha ao aplicar configurações")
        
        await log_activity(
            device_id=device_id, action="wifi_config_update",
            description=f"Configurações WiFi atualizadas: {', '.join(update_dict.keys())}",
            status="success", result=f"Aplicadas {success_count}/{len(tasks)} configurações"
        )
        
        return {"success": True, "message": f"Configurações WiFi atualizadas"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar WiFi do dispositivo {device_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.post("/refresh/{device_id}")
async def refresh_device_wifi_config(device_id: str):
    """
    Força refresh das configurações WiFi de um dispositivo
    """
    client = await get_genieacs_client()
    if not await client.get_device_by_id(device_id):
        raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
    
    if not await client.summon_device(device_id):
        raise HTTPException(status_code=500, detail="Falha ao executar refresh")

    await log_activity(device_id=device_id, action="device_refresh", description="Refresh WiFi solicitado")
    return {"success": True, "message": "Refresh solicitado"}
