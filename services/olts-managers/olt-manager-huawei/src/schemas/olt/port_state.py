from pydantic import BaseModel, ConfigDict

class PortState(BaseModel):
    admin_state: str
    link_state: str

    model_config = ConfigDict(from_attributes=True)
