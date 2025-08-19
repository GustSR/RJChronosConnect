"""
GenieACS NBI API Client
Cliente para integração com a API Northbound Interface do GenieACS
"""

import httpx
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
import os

logger = logging.getLogger(__name__)

class GenieACSClient:
    """Cliente para comunicação com GenieACS NBI API"""
    
    def __init__(self, base_url: str = None):
        self.base_url = (base_url or os.getenv("GENIACS_API_URL", "http://genieacs:7557")).rstrip('/')
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        )
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def get_devices(self, query: Dict[str, Any] = None, projection: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Busca dispositivos do GenieACS
        
        Args:
            query: Filtro de busca MongoDB-style
            projection: Campos a serem retornados
            
        Returns:
            Lista de dispositivos
        """
        try:
            params = {}
            
            if query:
                params["query"] = json.dumps(query)
                
            if projection:
                params["projection"] = ",".join(projection) if isinstance(projection, list) else projection
            
            response = await self.client.get(f"{self.base_url}/devices", params=params)
            response.raise_for_status()
            
            devices = response.json()
            logger.info(f"Recuperados {len(devices)} dispositivos do GenieACS")
            return devices
            
        except httpx.HTTPError as e:
            logger.error(f"Erro ao buscar dispositivos: {e}")
            return []
        except Exception as e:
            logger.error(f"Erro inesperado ao buscar dispositivos: {e}")
            return []
    
    async def get_device_by_id(self, device_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca um dispositivo específico por ID
        
        Args:
            device_id: ID do dispositivo
            
        Returns:
            Dados do dispositivo ou None se não encontrado
        """
        try:
            response = await self.client.get(f"{self.base_url}/devices/{device_id}")
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"Dispositivo {device_id} não encontrado")
                return None
            logger.error(f"Erro HTTP ao buscar dispositivo {device_id}: {e}")
            return None
        except Exception as e:
            logger.error(f"Erro inesperado ao buscar dispositivo {device_id}: {e}")
            return None
    
    async def get_faults(self, query: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Busca faults/alertas do GenieACS
        
        Args:
            query: Filtro de busca MongoDB-style
            
        Returns:
            Lista de faults
        """
        try:
            params = {}
            if query:
                params["query"] = json.dumps(query)
                
            response = await self.client.get(f"{self.base_url}/faults", params=params)
            response.raise_for_status()
            
            faults = response.json()
            logger.info(f"Recuperados {len(faults)} faults do GenieACS")
            return faults
            
        except httpx.HTTPError as e:
            logger.error(f"Erro ao buscar faults: {e}")
            return []
        except Exception as e:
            logger.error(f"Erro inesperado ao buscar faults: {e}")
            return []
    
    async def get_tasks(self, device_id: str = None) -> List[Dict[str, Any]]:
        """
        Busca tasks do GenieACS
        
        Args:
            device_id: ID do dispositivo (opcional)
            
        Returns:
            Lista de tasks
        """
        try:
            if device_id:
                endpoint = f"{self.base_url}/devices/{device_id}/tasks"
            else:
                endpoint = f"{self.base_url}/tasks"
                
            response = await self.client.get(endpoint)
            response.raise_for_status()
            
            tasks = response.json()
            logger.info(f"Recuperadas {len(tasks)} tasks do GenieACS")
            return tasks
            
        except httpx.HTTPError as e:
            logger.error(f"Erro ao buscar tasks: {e}")
            return []
        except Exception as e:
            logger.error(f"Erro inesperado ao buscar tasks: {e}")
            return []
    
    async def set_parameter(self, device_id: str, parameter: str, value: Any) -> bool:
        """
        Define um parâmetro em um dispositivo
        
        Args:
            device_id: ID do dispositivo
            parameter: Nome do parâmetro TR-069
            value: Valor a ser definido
            
        Returns:
            True se sucesso, False caso contrário
        """
        try:
            data = {
                "name": "setParameterValues",
                "parameterValues": [[parameter, value]]
            }
            
            response = await self.client.post(
                f"{self.base_url}/devices/{device_id}/tasks",
                json=data
            )
            response.raise_for_status()
            
            logger.info(f"Parâmetro {parameter} definido para {value} no dispositivo {device_id}")
            return True
            
        except httpx.HTTPError as e:
            logger.error(f"Erro ao definir parâmetro {parameter}: {e}")
            return False
        except Exception as e:
            logger.error(f"Erro inesperado ao definir parâmetro {parameter}: {e}")
            return False
    
    async def refresh_device(self, device_id: str) -> bool:
        """
        Força uma atualização de um dispositivo
        
        Args:
            device_id: ID do dispositivo
            
        Returns:
            True se sucesso, False caso contrário
        """
        try:
            data = {"name": "refreshObject", "objectName": ""}
            
            response = await self.client.post(
                f"{self.base_url}/devices/{device_id}/tasks",
                json=data
            )
            response.raise_for_status()
            
            logger.info(f"Refresh solicitado para dispositivo {device_id}")
            return True
            
        except httpx.HTTPError as e:
            logger.error(f"Erro ao fazer refresh do dispositivo {device_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Erro inesperado ao fazer refresh do dispositivo {device_id}: {e}")
            return False

# Singleton global para reutilização
_genieacs_client: Optional[GenieACSClient] = None

async def get_genieacs_client() -> GenieACSClient:
    """
    Retorna uma instância singleton do cliente GenieACS
    """
    global _genieacs_client
    if _genieacs_client is None:
        _genieacs_client = GenieACSClient()
    return _genieacs_client