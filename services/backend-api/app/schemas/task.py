from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class ActivityLog(BaseModel):
    id: str
    device_id: Optional[str] = None
    device_name: Optional[str] = None
    action: str
    description: str
    executed_by: Optional[str] = None
    timestamp: datetime
    status: str
    duration: Optional[str] = None
    result: Optional[str] = None
    metadata: Optional[dict] = None
