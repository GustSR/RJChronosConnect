from pydantic import BaseModel
from typing import Optional

class OntRegisterInfo(BaseModel):
    fs: str
    auth_type: str
    sn: str
    reg_time: str
    dereg_time: str
    dereg_reason: str

    class Config:
        orm_mode = True
