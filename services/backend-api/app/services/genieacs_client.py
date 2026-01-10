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
from urllib.parse import quote

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

    async def _get_json(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]],
        error_context: str,
        unexpected_context: str,
    ) -> Optional[Any]:
        try:
            response = await self.client.get(endpoint, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"{error_context}: {e}")
            return None
        except Exception as e:
            logger.error(f"{unexpected_context}: {e}")
            return None
    
    async def get_devices(self, query: Dict[str, Any] = None, projection: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Busca dispositivos do GenieACS
        
        Args:
            query: Filtro de busca MongoDB-style
            projection: Campos a serem retornados
            
        Returns:
            Lista de dispositivos
        """
        params: Dict[str, Any] = {}

        if query:
            params["query"] = json.dumps(query)

        if projection:
            params["projection"] = ",".join(projection) if isinstance(projection, list) else projection

        devices = await self._get_json(
            f"{self.base_url}/devices",
            params,
            "Erro ao buscar dispositivos",
            "Erro inesperado ao buscar dispositivos",
        )
        if devices is None:
            return []

        logger.info(f"Recuperados {len(devices)} dispositivos do GenieACS")
        return devices
    
    async def get_device_by_id(self, device_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca um dispositivo específico por ID
        
        Args:
            device_id: ID do dispositivo
            
        Returns:
            Dados do dispositivo ou None se não encontrado
        """
        # GenieACS não suporta /devices/{id}, então fazemos query na lista completa
        query = {"_id": device_id}
        params = {"query": json.dumps(query)}

        devices = await self._get_json(
            f"{self.base_url}/devices",
            params,
            f"Erro HTTP ao buscar dispositivo {device_id}",
            f"Erro inesperado ao buscar dispositivo {device_id}",
        )
        if devices is None:
            return None

        if devices and len(devices) > 0:
            logger.info(f"Dispositivo {device_id} encontrado")
            return devices[0]

        logger.warning(f"Dispositivo {device_id} não encontrado")
        return None
    
    async def get_faults(self, query: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Busca faults/alertas do GenieACS
        
        Args:
            query: Filtro de busca MongoDB-style
            
        Returns:
            Lista de faults
        """
        params: Dict[str, Any] = {}
        if query:
            params["query"] = json.dumps(query)

        faults = await self._get_json(
            f"{self.base_url}/faults",
            params,
            "Erro ao buscar faults",
            "Erro inesperado ao buscar faults",
        )
        if faults is None:
            return []

        logger.info(f"Recuperados {len(faults)} faults do GenieACS")
        return faults
    
    async def get_tasks(self, device_id: str = None) -> List[Dict[str, Any]]:
        """
        Busca tasks do GenieACS
        
        Args:
            device_id: ID do dispositivo (opcional)
            
        Returns:
            Lista de tasks
        """
        if device_id:
            endpoint = f"{self.base_url}/devices/{device_id}/tasks"
        else:
            endpoint = f"{self.base_url}/tasks"

        tasks = await self._get_json(
            endpoint,
            None,
            "Erro ao buscar tasks",
            "Erro inesperado ao buscar tasks",
        )
        if tasks is None:
            return []

        logger.info(f"Recuperadas {len(tasks)} tasks do GenieACS")
        return tasks
    
    async def set_parameter(self, device_id: str, parameter: str, value: Any, immediate: bool = True) -> bool:
        """
        Define um parâmetro em um dispositivo
        
        Args:
            device_id: ID do dispositivo
            parameter: Nome do parâmetro TR-069
            value: Valor a ser definido
            immediate: Se True, força connection request imediato (padrão: True)
            
        Returns:
            True se sucesso, False caso contrário
        """
        try:
            data = {
                "name": "setParameterValues",
                "parameterValues": [[parameter, value]]
            }
            
            logger.info(f"🔧 ENVIANDO TASK para GenieACS:")
            logger.info(f"   Device ID: {device_id}")
            logger.info(f"   Parameter: {parameter}")
            logger.info(f"   Value: {value}")
            
            # Construir URL com connection_request se immediate=True
            url = f"{self.base_url}/devices/{device_id}/tasks"
            if immediate:
                url += "?connection_request"
                logger.info(f"🚀 USANDO CONNECTION REQUEST IMEDIATO")
            
            logger.info(f"   URL: {url}")
            logger.info(f"   Data: {data}")
            
            response = await self.client.post(url, json=data)
            
            logger.info(f"📨 RESPOSTA do GenieACS:")
            logger.info(f"   Status Code: {response.status_code}")
            logger.info(f"   Headers: {dict(response.headers)}")
            logger.info(f"   Content: {response.text}")
            
            response.raise_for_status()
            
            logger.info(f"✅ Parâmetro {parameter} definido para {value} no dispositivo {device_id}")
            return True
            
        except httpx.HTTPError as e:
            logger.error(f"❌ ERRO HTTP ao definir parâmetro {parameter}: {e}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"   Response status: {e.response.status_code}")
                logger.error(f"   Response body: {e.response.text}")
            return False
        except Exception as e:
            logger.error(f"❌ ERRO inesperado ao definir parâmetro {parameter}: {e}")
            return False
    
    async def add_tag(self, device_id: str, tag: str) -> bool:
        """
        Adiciona uma tag a um dispositivo no GenieACS.

        Args:
            device_id: ID do dispositivo
            tag: Tag a ser adicionada

        Returns:
            True se sucesso, False caso contrário
        """
        try:
            encoded_tag = quote(tag, safe="")
            url = f"{self.base_url}/devices/{device_id}/tags/{encoded_tag}"

            logger.info(f"🏷️ ADICIONANDO TAG no GenieACS:")
            logger.info(f"   Device ID: {device_id}")
            logger.info(f"   Tag: {tag}")

            response = await self.client.post(url)
            response.raise_for_status()
            return True

        except httpx.HTTPError as e:
            logger.error(f"❌ ERRO HTTP ao adicionar tag {tag}: {e}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"   Response status: {e.response.status_code}")
                logger.error(f"   Response body: {e.response.text}")
            return False
        except Exception as e:
            logger.error(f"❌ ERRO inesperado ao adicionar tag {tag}: {e}")
            return False

    async def enqueue_task(
        self,
        device_id: str,
        task: Dict[str, Any],
        connection_request: bool = False,
    ) -> bool:
        """
        Enfileira uma task no GenieACS.

        Args:
            device_id: ID do dispositivo
            task: Estrutura da task (ex.: refreshObject, setParameterValues)
            connection_request: Se True, solicita connection_request imediato

        Returns:
            True se sucesso, False caso contrário
        """
        try:
            url = f"{self.base_url}/devices/{device_id}/tasks"
            if connection_request:
                url += "?connection_request"

            logger.info(f"🧩 ENFILEIRANDO TASK no GenieACS:")
            logger.info(f"   Device ID: {device_id}")
            logger.info(f"   Connection request: {connection_request}")
            logger.info(f"   Task: {task}")

            response = await self.client.post(url, json=task)
            response.raise_for_status()
            return True

        except httpx.HTTPError as e:
            logger.error(f"❌ ERRO HTTP ao enfileirar task: {e}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"   Response status: {e.response.status_code}")
                logger.error(f"   Response body: {e.response.text}")
            return False
        except Exception as e:
            logger.error(f"❌ ERRO inesperado ao enfileirar task: {e}")
            return False

    async def refresh_wifi_passwords(self, device_id: str) -> bool:
        """
        Força refresh específico dos parâmetros de senha WiFi
        
        Args:
            device_id: ID do dispositivo
            
        Returns:
            True se sucesso, False caso contrário
        """
        try:
            # Refresh específico para parâmetros de senha WiFi
            wifi_password_objects = [
                "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey",
                "InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.PreSharedKey",
                "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.WPA",
                "InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.WPA"
            ]
            
            success_count = 0
            for obj_name in wifi_password_objects:
                try:
                    data = {
                        "name": "refreshObject",
                        "objectName": obj_name
                    }
                    
                    url = f"{self.base_url}/devices/{device_id}/tasks?connection_request"
                    
                    logger.info(f"🔄 REFRESH WiFi passwords - {obj_name}")
                    
                    response = await self.client.post(url, json=data)
                    response.raise_for_status()
                    success_count += 1
                    
                except Exception as e:
                    logger.warning(f"⚠️ Falha ao refresh {obj_name}: {e}")
            
            logger.info(f"✅ Refresh WiFi passwords: {success_count}/{len(wifi_password_objects)} sucessos")
            return success_count > 0
            
        except Exception as e:
            logger.error(f"❌ ERRO no refresh WiFi passwords: {e}")
            return False

    async def summon_device(self, device_id: str) -> bool:
        """
        Força um 'summon' imediato do dispositivo (equivalente ao botão Summon no GenieACS UI)
        
        Args:
            device_id: ID do dispositivo
            
        Returns:
            True se sucesso, False caso contrário
        """
        try:
            data = {
                "name": "refreshObject",
                "objectName": ""  # Root refresh - força refresh de todos os parâmetros
            }
            
            url = f"{self.base_url}/devices/{device_id}/tasks?connection_request"
            
            logger.info(f"🌟 SUMMON DEVICE (como botão GenieACS UI):")
            logger.info(f"   Device ID: {device_id}")
            logger.info(f"   URL: {url}")
            logger.info(f"   Data: {data}")
            
            response = await self.client.post(url, json=data)
            
            logger.info(f"📨 RESPOSTA SUMMON:")
            logger.info(f"   Status Code: {response.status_code}")
            logger.info(f"   Content: {response.text}")
            
            response.raise_for_status()
            
            logger.info(f"✅ Dispositivo {device_id} summonado com sucesso!")
            return True
            
        except httpx.HTTPError as e:
            logger.error(f"❌ ERRO HTTP ao summonar dispositivo {device_id}: {e}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"   Response status: {e.response.status_code}")
                logger.error(f"   Response body: {e.response.text}")
            return False
        except Exception as e:
            logger.error(f"❌ ERRO inesperado ao summonar dispositivo {device_id}: {e}")
            return False
    
    async def refresh_ip_parameters(self, device_id: str) -> bool:
        """
        Força refresh específico dos parâmetros de IP (ExternalIPAddress)
        
        Args:
            device_id: ID do dispositivo
            
        Returns:
            True se sucesso, False caso contrário
        """
        try:
            # Lista de parâmetros IP para tentar (baseado no que descobrimos)
            ip_parameters = [
                "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.2.ExternalIPAddress",
                "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress",
                "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.2.WANIPConnection.1.ExternalIPAddress",
                "InternetGatewayDevice.Services.X_HUAWEI_WANRemoteAccess.IPAddress2",
                "InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.IPInterface.1.IPInterfaceIPAddress",
                "Device.IP.Interface.1.IPv4Address.1.IPAddress"
            ]
            
            success_count = 0
            
            for param in ip_parameters:
                try:
                    data = {
                        "name": "refreshObject",
                        "objectName": param
                    }
                    
                    url = f"{self.base_url}/devices/{device_id}/tasks?connection_request"
                    
                    response = await self.client.post(url, json=data)
                    if response.status_code in [200, 202]:
                        success_count += 1
                        logger.info(f"✅ Refresh IP parameter: {param}")
                    
                except Exception as e:
                    logger.warning(f"⚠️ Falha ao refresh {param}: {e}")
                    continue
            
            logger.info(f"🌐 IP Parameters refresh: {success_count}/{len(ip_parameters)} sucessos")
            return success_count > 0
            
        except Exception as e:
            logger.error(f"❌ ERRO ao fazer refresh de parâmetros IP: {e}")
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
