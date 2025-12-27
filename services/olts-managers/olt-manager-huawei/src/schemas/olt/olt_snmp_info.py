from typing import Optional

from pydantic import BaseModel, ConfigDict


class OltSnmpInfo(BaseModel):
    sys_descr: Optional[str] = None
    sys_object_id: Optional[str] = None
    sys_uptime: Optional[str] = None
    sys_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
