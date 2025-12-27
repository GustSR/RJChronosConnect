from pydantic import BaseModel, ConfigDict
from typing import Optional

class OntRegisterInfo(BaseModel):
    fs: str
    auth_type: str
    sn: str
    reg_time: str
    dereg_time: str
    dereg_reason: str

    model_config = ConfigDict(from_attributes=True)
