# -*- coding: utf-8 -*-
"""
Define o schema de dados para informações de tráfego de uma porta de ONT.
"""

from pydantic import BaseModel

class OntTrafficInfo(BaseModel):
    """Representa o tráfego de uma porta específica de uma ONT."""
    port_index: int
    ingress_bytes: int
    egress_bytes: int
