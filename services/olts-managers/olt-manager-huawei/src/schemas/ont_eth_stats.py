from pydantic import BaseModel

class OntEthStats(BaseModel):
    packets_received: int
    bytes_received: int
    unicast_packets_received: int
    broadcast_packets_received: int
    multicast_packets_received: int
    packets_sent: int
    bytes_sent: int
    unicast_packets_sent: int
    broadcast_packets_sent: int
    multicast_packets_sent: int

    class Config:
        orm_mode = True
