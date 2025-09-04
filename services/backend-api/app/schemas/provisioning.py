from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PendingONUModel(BaseModel):
    id: str
    serial_number: str
    olt_name: str
    board: int
    port: int
    discovered_at: datetime
    distance: Optional[float] = None
    onu_type: str
    status: str = "pending"
    rx_power: Optional[float] = None
    temperature: Optional[float] = None

class ProvisionedDevice(BaseModel):
    device_id: str
    serial_number: str
    client_name: str
    client_address: str
    service_profile: str
    vlan_id: int
    wan_mode: str
    pppoe_username: Optional[str] = None
    pppoe_password: Optional[str] = None
    provisioned_at: datetime
    provisioned_by: str = "admin"
    status: str = "active"
    comment: Optional[str] = None

class ONUProvisionRequest(BaseModel):
    client_name: str
    client_address: str
    service_profile: str = "default"
    vlan_id: Optional[int] = 100
    wan_mode: str = "dhcp"  # dhcp, pppoe, static
    pppoe_username: Optional[str] = None
    pppoe_password: Optional[str] = None
    comment: Optional[str] = None

class ClientConfigurationUpdate(BaseModel):
    client_name: Optional[str] = None
    client_address: Optional[str] = None
    service_profile: Optional[str] = None
    vlan_id: Optional[int] = None
    wan_mode: Optional[str] = None
    pppoe_username: Optional[str] = None
    pppoe_password: Optional[str] = None
    comment: Optional[str] = None
