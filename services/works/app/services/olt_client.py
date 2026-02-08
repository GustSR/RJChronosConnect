import httpx
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

class OLTClient:
    def __init__(self):
        self.base_url = settings.OLT_MANAGER_HUAWEI_URL

    async def add_ont_basic(self, olt_id: int, data: dict):
        """Passo 1 Atômico: Adiciona a ONT fisicamente na OLT"""
        url = f"{self.base_url}/api/v1/olts/{olt_id}/onts/simple"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, timeout=30.0)
            response.raise_for_status()
            return response.json()

    async def get_provisioned_onts(self, olt_id: int, port: str):
        """Consulta as ONTs já existentes em uma porta PON"""
        p = port.split('/')
        url = f"{self.base_url}/api/v1/olts/{olt_id}/ports/{p[0]}/{p[1]}/{p[2]}/onts/all"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=20.0)
            response.raise_for_status()
            return response.json()

    async def configure_wan(self, olt_id: int, data: dict):
        """Passo 2a Atômico: Configura IP/VLAN de gerência"""
        url = f"{self.base_url}/api/v1/olts/{olt_id}/onts/wan-config-only"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, timeout=30.0)
            response.raise_for_status()
            return response.json()

    async def configure_tr069(self, olt_id: int, data: dict):
        """Passo 2b Atômico: Configura perfil ACS/TR-069"""
        url = f"{self.base_url}/api/v1/olts/{olt_id}/onts/tr069-config-only"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, timeout=30.0)
            response.raise_for_status()
            return response.json()

    async def add_service_port(self, olt_id: int, data: dict):
        """Passo 3 Atômico: Cria o túnel de internet (Service Port)"""
        url = f"{self.base_url}/api/v1/olts/{olt_id}/service-ports"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, timeout=30.0)
            response.raise_for_status()
            return response.json()

    async def reboot_ont(self, olt_id: int, port: str, ont_id: int):
        """Passo Final: Reinicia para aplicar as configurações"""
        p = port.split('/')
        url = f"{self.base_url}/api/v1/olts/{olt_id}/ports/{p[0]}/{p[1]}/{p[2]}/onts/{ont_id}/reboot"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, timeout=30.0)
            return response.json()

    async def delete_ont(self, olt_id: int, port: str, ont_id: int):
        """Ação de Compensação: Remove a ONT em caso de falha na Saga"""
        p = port.split('/')
        url = f"{self.base_url}/api/v1/olts/{olt_id}/ports/{p[0]}/{p[1]}/{p[2]}/onts/{ont_id}"
        async with httpx.AsyncClient() as client:
            response = await client.delete(url, timeout=30.0)
            return response.json()
