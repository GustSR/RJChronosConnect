from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

# ── Schemas para interacao com banco de dados ──────────────────────────


class DeviceBase(BaseModel):
    serial_number: str
    mac_address: Optional[str] = None
    genieacs_id: Optional[str] = None
    ont_id: Optional[int] = None
    subscriber_id: int
    olt_port_id: int
    status_id: int


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(DeviceBase):
    pass


class DeviceResponse(DeviceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Schemas para respostas de API (GenieACS / dados transformados) ─────


class GenieACSDeviceBase(BaseModel):
    id: str
    serial_number: str
    model: str
    status: str
    ip_address: Optional[str] = None
    last_seen: Optional[datetime] = None
    created_at: datetime


class CPE(GenieACSDeviceBase):
    wifi_enabled: bool = True
    wifi_ssid: Optional[str] = None
    signal_strength: Optional[float] = None
    customer_name: Optional[str] = None


class ONU(GenieACSDeviceBase):
    olt_id: str
    pon_port: str
    rx_power: Optional[float] = None
    tx_power: Optional[float] = None
    distance: Optional[float] = None


class OLT(GenieACSDeviceBase):
    location: str
    pon_ports: int = 16
    active_onus: int = 0
