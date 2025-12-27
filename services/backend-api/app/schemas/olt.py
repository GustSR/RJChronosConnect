from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class OLTBase(BaseModel):
    name: str
    ip_address: str
    vendor: Optional[str] = None
    model: Optional[str] = None

class OLTCreate(OLTBase):
    # Campos opcionais para configuração automática
    ssh_username: Optional[str] = None
    ssh_password: Optional[str] = None
    ssh_port: Optional[int] = Field(default=22, ge=1, le=65535)
    snmp_community: Optional[str] = None

class OLTUpdate(OLTBase):
    # Todos os campos opcionais para update
    name: Optional[str] = None
    ip_address: Optional[str] = None
    ssh_username: Optional[str] = None
    ssh_password: Optional[str] = None
    ssh_port: Optional[int] = Field(default=None, ge=1, le=65535)
    snmp_community: Optional[str] = None
    setup_status: Optional[str] = Field(default=None, pattern=r'^(pending|configured|failed)$')
    is_configured: Optional[bool] = None

class OLT(OLTBase):
    id: int
    ssh_username: Optional[str] = None
    ssh_port: int = 22
    setup_status: str = "pending"
    is_configured: bool = False
    discovered_at: Optional[datetime] = None
    last_sync_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Schemas específicos para operações de descoberta e configuração
class OLTDiscoveryRequest(BaseModel):
    ip_address: str
    ssh_username: str
    ssh_password: str
    ssh_port: Optional[int] = Field(default=22, ge=1, le=65535)
    auto_configure: bool = Field(default=False, description="Se deve configurar automaticamente após descoberta")

class OLTSetupRequest(BaseModel):
    snmp_community: Optional[str] = Field(default="public", description="Community SNMP para configurar")
    trap_destination: Optional[str] = Field(default=None, description="Destino para envio de traps SNMP")
    enable_auto_provisioning: bool = Field(default=True, description="Habilitar provisionamento automático")

class OLTSetupResponse(BaseModel):
    olt_id: int
    setup_status: str
    message: str
    setup_log_id: Optional[int] = None
    duration_seconds: Optional[int] = None
