from pydantic import BaseModel
from typing import Optional

class WiFiConfig(BaseModel):
    device_id: str
    ssid: str
    security: str
    password: Optional[str] = None
    band: Optional[str] = None
    channel: Optional[str] = None
    power: Optional[int] = None
    hidden: bool = False
    enabled: bool = True

class WiFiConfigUpdate(BaseModel):
    ssid: Optional[str] = None
    security: Optional[str] = None
    password: Optional[str] = None
    band: Optional[str] = None
    channel: Optional[str] = None
    power: Optional[int] = None
    hidden: Optional[bool] = None
    enabled: Optional[bool] = None
