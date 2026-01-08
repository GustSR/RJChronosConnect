from typing import Optional

from pydantic import BaseModel, Field


class OnuIndexRequest(BaseModel):
    onu_index: str = Field(..., min_length=1)


class WhitelistAddRequest(BaseModel):
    serial_number: str = Field(..., min_length=1)
    slot: int = Field(..., ge=0)
    link: int = Field(..., ge=0)
    onu_id: int = Field(..., ge=0)
    onu_type: str = Field(..., min_length=1)
    password: Optional[str] = None


class WhitelistRemoveRequest(BaseModel):
    serial_number: str = Field(..., min_length=1)
    slot: int = Field(..., ge=0)
    link: int = Field(..., ge=0)


class OnuServiceVlanRequest(BaseModel):
    slot: int = Field(..., ge=0)
    link: int = Field(..., ge=0)
    onu_id: int = Field(..., ge=0)
    port: int = Field(..., ge=0)
    service_number: int = Field(1, ge=1)
    vlan_id: int = Field(..., ge=1, le=4094)
    vlan_mode: str = Field("tag", min_length=1)
    tpid: str = Field("0x8100", min_length=1)
    pvid: Optional[int] = Field(None, ge=1, le=4094)
    traffic_type: str = Field("unicast", min_length=1)


class Tr069EnableRequest(BaseModel):
    onu_id: int = Field(..., ge=0)
    acs_url: str = Field(..., min_length=1)
    acs_user: str = Field(..., min_length=1)
    acs_password: str = Field(..., min_length=1)
    inform_interval: int = Field(28800, ge=1)
    port: int = Field(0, ge=0)
    cpe_user: Optional[str] = None
    cpe_password: Optional[str] = None
    middleware_disable: bool = True
    interface_context: Optional[str] = None


class Tr069DisableRequest(BaseModel):
    onu_id: int = Field(..., ge=0)
    interface_context: Optional[str] = None
