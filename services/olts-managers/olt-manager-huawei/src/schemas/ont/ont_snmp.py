from typing import Optional

from pydantic import BaseModel, ConfigDict


class OntSnmpInfo(BaseModel):
    port: str
    ont_id: int
    serial_number: str
    if_index: Optional[int] = None
    description: Optional[str] = None
    distance_m: Optional[str] = None
    online_state: Optional[str] = None
    last_down_cause: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
