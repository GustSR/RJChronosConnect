from pydantic import BaseModel
from typing import Optional

class OntFailed(BaseModel):
    fsp: str
    ont_id: int
    sn: str
    password: str
    fail_time: str
    fail_reason: str

    class Config:
        orm_mode = True
