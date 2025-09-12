from pydantic import BaseModel

class LaserStateSetRequest(BaseModel):
    state: str
