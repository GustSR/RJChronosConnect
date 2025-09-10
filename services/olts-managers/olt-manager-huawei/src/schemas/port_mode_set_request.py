from pydantic import BaseModel

class PortModeSetRequest(BaseModel):
    mode: str
