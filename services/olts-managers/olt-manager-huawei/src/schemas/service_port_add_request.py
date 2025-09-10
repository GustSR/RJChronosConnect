from pydantic import BaseModel
from typing import Optional

class ServicePortAddRequest(BaseModel):
    index: int
    vlan_id: int
    frame: int
    slot: int
    port: int
    ont_id: int
    gemport_id: int
    user_vlan_id: int
    tag_transform: Optional[str] = "translate"
