import httpx
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

class BackendClient:
    def __init__(self):
        self.base_url = settings.BACKEND_API_URL

    async def update_ont_id_by_serial(self, serial_number: str, ont_id: int):
        """Atualiza o ont_id físico de um cliente provisionado usando o Serial Number."""
        url = f"{self.base_url}/api/v1/provisioning/clients/serial/{serial_number}"
        payload = {"ont_id": ont_id}
        
        async with httpx.AsyncClient() as client:
            response = await client.put(url, json=payload, timeout=10.0)
            response.raise_for_status()
            return response.json()