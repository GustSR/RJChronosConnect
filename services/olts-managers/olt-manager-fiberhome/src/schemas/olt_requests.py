from typing import Optional

from pydantic import BaseModel, Field


class VlanCreateRequest(BaseModel):
    vlan_id: int = Field(..., ge=1, le=4094)
    vlan_type: Optional[str] = Field("smart")

