from pydantic import BaseModel

class MacAddressInfo(BaseModel):
    mac_address: str
    vlan_id: int
    port: str
    ont_id: int
