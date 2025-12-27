from pydantic import BaseModel, ConfigDict

class OltVersion(BaseModel):
    version: str

    model_config = ConfigDict(from_attributes=True)
