from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Device(BaseModel):
    id: str
    serial_number: str
    model: str
    status: str
    ip_address: Optional[str] = None
    last_seen: Optional[datetime] = None
    created_at: datetime

class CPE(Device):
    wifi_enabled: bool = True
    wifi_ssid: Optional[str] = None
    signal_strength: Optional[float] = None
    customer_name: Optional[str] = None

class ONU(Device):
    olt_id: str
    pon_port: str
    rx_power: Optional[float] = None
    tx_power: Optional[float] = None
    distance: Optional[float] = None

class OLT(Device):
    location: str
    pon_ports: int = 16
    active_onus: int = 0
