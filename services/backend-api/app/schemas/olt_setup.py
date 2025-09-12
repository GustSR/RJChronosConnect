from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class OltSetupLogBase(BaseModel):
    action: str
    status: str
    message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class OltSetupLogCreate(OltSetupLogBase):
    olt_id: int
    executed_by_user_id: Optional[int] = None

class OltSetupLogUpdate(BaseModel):
    status: Optional[str] = None
    message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None

class OltSetupLog(OltSetupLogBase):
    id: int
    olt_id: int
    executed_by_user_id: Optional[int] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None

    class Config:
        orm_mode = True

# Schemas para respostas de descoberta
class OLTDiscoveryResult(BaseModel):
    success: bool
    olt_id: Optional[int] = None
    vendor: Optional[str] = None
    model: Optional[str] = None
    system_info: Optional[Dict[str, Any]] = None
    setup_log_id: Optional[int] = None
    message: str
    duration_seconds: Optional[int] = None

class OLTDiscoveryResponse(BaseModel):
    discoveries: list[OLTDiscoveryResult]
    total_attempts: int
    successful_discoveries: int
    failed_discoveries: int