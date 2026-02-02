from pydantic import BaseModel
from typing import Optional

class OntWanConfigRequest(BaseModel):
    serial_number: str
    port: Optional[str] = None
    ont_id: Optional[int] = None
    mgmt_vlan: int = 200
    tr069_profile_id: int = 2
    ip_mode: str = "dhcp"
    ip_address: Optional[str] = None
    mask: Optional[str] = None
    gateway: Optional[str] = None
    ip_index: int = 1