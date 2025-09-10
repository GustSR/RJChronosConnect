from pydantic import BaseModel
from typing import Any

class CommandResponse(BaseModel):
    status: str
    message: Any
