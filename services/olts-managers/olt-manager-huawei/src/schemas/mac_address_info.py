"""
Schema para informações de endereços MAC.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MacAddressInfo(BaseModel):
    """
    Informações sobre endereços MAC aprendidos na OLT.

    Contém dados sobre endereços MAC descobertos em portas PON,
    incluindo informações de localização e status.
    """
    mac_address: str
    port: str
    vlan_id: int
    ont_id: Optional[int] = None
    learned_time: Optional[datetime] = None
    status: str
    port_type: Optional[str] = None