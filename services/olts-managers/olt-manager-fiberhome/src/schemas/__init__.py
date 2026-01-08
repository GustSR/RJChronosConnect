from .ont_requests import (
    OnuIndexRequest,
    OnuServiceVlanRequest,
    Tr069DisableRequest,
    Tr069EnableRequest,
    WhitelistAddRequest,
    WhitelistRemoveRequest,
)
from .olt_requests import VlanCreateRequest

__all__ = [
    "OnuIndexRequest",
    "OnuServiceVlanRequest",
    "Tr069DisableRequest",
    "Tr069EnableRequest",
    "WhitelistAddRequest",
    "WhitelistRemoveRequest",
    "VlanCreateRequest",
]
