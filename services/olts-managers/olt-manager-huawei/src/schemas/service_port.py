"""
Schema para informações de service-port.
"""

from pydantic import BaseModel
from typing import Optional


class ServicePort(BaseModel):
    """
    Informações sobre uma service-port configurada na OLT.

    Service-ports são usadas para mapear tráfego entre ONTs e a rede upstream,
    definindo VLANs, QoS e outras configurações de rede.
    """
    port_id: int
    port_name: str
    vlan_id: int
    user_vlan: Optional[int] = None
    traffic_profile: Optional[str] = None
    state: str
    description: Optional[str] = None