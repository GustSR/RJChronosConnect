from pydantic import BaseModel
from typing import Optional

class ONTAddRequest(BaseModel):
    port: str
    ont_id: int
    serial_number: str
    line_profile: str
    srv_profile: str
    description: Optional[str] = None
    ont_type: Optional[str] = None
    # Configurações de Gerência (TR-069)
    tr069_profile_id: Optional[int] = None
    mgmt_vlan: Optional[int] = None
    ip_mode: Optional[str] = "dhcp"
    ip_address: Optional[str] = None
    mask: Optional[str] = None
    gateway: Optional[str] = None
