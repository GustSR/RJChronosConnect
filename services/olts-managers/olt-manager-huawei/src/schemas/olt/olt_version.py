from pydantic import BaseModel

class OltVersion(BaseModel):
    version: str

    class Config:
        orm_mode = True
