"""
Schema para requisição de criação de service-port.
"""

from pydantic import BaseModel
from typing import Optional


class ServicePortAddRequest(BaseModel):
    """
    Requisição para criar uma nova service-port na OLT.

    Define todos os parâmetros necessários para configurar uma service-port,
    incluindo VLAN, perfil de tráfego e outras configurações.
    """
    port_name: str
    vlan_id: int
    user_vlan: Optional[int] = None
    traffic_profile: Optional[str] = None
    gem_port: Optional[int] = None
    ont_port: str
    description: Optional[str] = None