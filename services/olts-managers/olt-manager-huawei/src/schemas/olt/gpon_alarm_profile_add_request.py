from pydantic import BaseModel

class GponAlarmProfileAddRequest(BaseModel):
    profile_id: int
    profile_name: str
