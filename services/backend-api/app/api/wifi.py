from fastapi import APIRouter, HTTPException
from typing import List, Optional
import logging
import asyncio

# Import schemas and services
from app.schemas.wifi import WiFiConfigUpdate
from app.services.genieacs_client import get_genieacs_client
from app.services.genieacs_transformers import (
    extract_wifi_config_from_device,
    create_wifi_parameter_updates,
    format_wifi_configs_for_frontend
)

# Logger
logger = logging.getLogger(__name__)

# APIRouter
router = APIRouter()

@router.get("/configs")
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

@router.get("/configs/{device_id}")
async def get_device_wifi_config(device_id: str, band: str = "2.4GHz"):
    """
    Retorna configuração WiFi de um dispositivo específico
    """
    try:
        client = await get_genieacs_client()
        
        logger.info(f"🔄 FORÇANDO REFRESH de senhas WiFi para {device_id} (banda {band})")
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
async def update_device_wifi_config(device_id: str, updates: WiFiConfigUpdate, band: str = "2.4GHz"):
    """
    Atualiza configuração WiFi de um dispositivo
    """
    try:
        client = await get_genieacs_client()
        
        device_data = await client.get_device_by_id(device_id)
        if not device_data:
            raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
        
        update_dict = {k: v for k, v in updates.dict().items() if v is not None}
        
        logger.info(f"🎯 UPDATE WiFi REQUEST para dispositivo {device_id} (banda: {band}):")
        logger.info(f"   Updates filtrados (sem None): {update_dict}")
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="Nenhuma atualização fornecida")
        
        tasks = create_wifi_parameter_updates(device_id, update_dict, band)
        
        if not tasks:
            raise HTTPException(status_code=400, detail="Nenhuma task válida gerada")
        
        success_count = 0
        for task in tasks:
            try:
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

@router.post("/refresh/{device_id}")
async def refresh_device_wifi_config(device_id: str):
    """
    Força refresh das configurações WiFi de um dispositivo
    """
    try:
        client = await get_genieacs_client()
        
        device_data = await client.get_device_by_id(device_id)
        if not device_data:
            raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
        
        success = await client.summon_device(device_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Falha ao executar refresh")
        
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

@router.post("/refresh-ip/{device_id}")
async def refresh_device_ip_parameters(device_id: str):
    """
    Força refresh dos parâmetros de IP de um dispositivo
    """
    try:
        client = await get_genieacs_client()
        
        device_data = await client.get_device_by_id(device_id)
        if not device_data:
            raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
        
        success = await client.refresh_ip_parameters(device_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Falha ao executar refresh de IP")
        
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
