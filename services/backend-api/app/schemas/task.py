from pydantic import BaseModel
from typing import Optional

# Pydantic model for the task request
class TaskRequest(BaseModel):
    device_id: str
    action: str
    parameters: Optional[dict] = None