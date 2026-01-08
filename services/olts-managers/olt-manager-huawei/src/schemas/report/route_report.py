from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class RouteReportRequest(BaseModel):
    frame: int = Field(default=0, ge=0, le=31)
    slot: Optional[int] = Field(default=None, ge=0, le=31)
    pon: Optional[int] = Field(default=None, ge=0, le=31)
    port: Optional[str] = None
    if_index: Optional[int] = Field(default=None, ge=1)
    los_threshold: int = Field(default=10, ge=1, le=128)
    format: str = Field(default="json")
    timeout: int = Field(default=5, ge=1, le=30)
    retries: int = Field(default=1, ge=0, le=5)


class RouteReportSummary(BaseModel):
    olt_id: int
    if_index: int
    port: Optional[str] = None
    slot: Optional[int] = None
    pon: Optional[int] = None
    los_count: int
    classification: str
    generated_at: datetime


class RouteReportOnu(BaseModel):
    customer_name: Optional[str] = None
    contract: Optional[str] = None
    equipment_sn: Optional[str] = None
    actual_sn: Optional[str] = None
    rx_power_dbm: Optional[float] = None
    last_down_time: Optional[str] = None
    last_down_cause: Optional[str] = None
    if_index: int
    ont_index: int
    port: Optional[str] = None
    slot: Optional[int] = None
    pon: Optional[int] = None


class RouteReport(BaseModel):
    summary: RouteReportSummary
    onus: List[RouteReportOnu]
