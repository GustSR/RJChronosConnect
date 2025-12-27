from pydantic import BaseModel, ConfigDict
from typing import Optional

class OntFailed(BaseModel):
    fsp: str
    ont_id: int
    sn: str
    password: str
    fail_time: str
    fail_reason: str

    model_config = ConfigDict(from_attributes=True)
