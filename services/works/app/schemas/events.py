from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class ProvisioningEvent(BaseModel):
    task_id: str
    olt_id: int
    port: str
    ont_id: int
    serial_number: str
    line_profile: str
    srv_profile: str
    description: Optional[str] = None
    
    # Dados de rede (Alinhados com ONUProvisionRequest do Backend)
    vlan_id: Optional[int] = None
    wan_mode: Optional[str] = "dhcp" # dhcp, pppoe, static
    ip_address: Optional[str] = None
    mask: Optional[str] = None
    gateway: Optional[str] = None
    tr069_profile_id: Optional[int] = None
    
    # Metadados da Saga
    step: str = "start" # start, basic_config, wan_config, service_port, finish
    retry_count: int = 0
