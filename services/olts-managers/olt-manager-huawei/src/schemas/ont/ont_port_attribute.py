from pydantic import BaseModel, ConfigDict
from typing import Optional

class OntPortAttribute(BaseModel):
    admin_state: str
    link_state: str
    speed: str
    duplex: str

    model_config = ConfigDict(from_attributes=True)
