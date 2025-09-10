# -*- coding: utf-8 -*-
"""
Este módulo contém o comando para obter estatísticas de tráfego de uma ONT.
"""

import re
from typing import List, Dict, Any

from .base_command import OLTCommand

class DisplayOntTrafficCommand(OLTCommand):
    """Executa 'display ont traffic' e faz o parsing do resultado."""

    def __init__(self, port: str, ont_id: int):
        """
        Inicializa o comando.

        Args:
            port (str): A porta no formato 'frame/slot/pon'.
            ont_id (int): O ID da ONT na porta PON.
        """
        self.port = port
        self.ont_id = ont_id

    def execute(self, connection_manager, olt_version: str) -> List[Dict[str, Any]]:
        """Envia o comando para a OLT e retorna o resultado do parsing."""
        command_str = f"display ont traffic {self.port} {self.ont_id}"
        raw_output = connection_manager.send_command(command_str)
        return self._parse_output(raw_output, olt_version)

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        """
        Faz o parsing da saída do comando 'display ont traffic'.
        
        A saída esperada tem o formato:
        ----------------------------------------------------------------------------
          ONT-ID   Port-ID   Ingress(bytes)   Egress(bytes)
        ----------------------------------------------------------------------------
               0         1         10980050       234567890
               0         2                0               0
        ----------------------------------------------------------------------------
        """
        traffic_data = []
        # A regex captura as linhas que contêm os dados de tráfego.
        pattern = re.compile(r"^\s*\d+\s+(?P<port_id>\d+)\s+(?P<ingress>\d+)\s+(?P<egress>\d+)", re.MULTILINE)

        for match in pattern.finditer(raw_output):
            data = match.groupdict()
            traffic_data.append({
                "port_index": int(data["port_id"]),
                "ingress_bytes": int(data["ingress"]),
                "egress_bytes": int(data["egress"])
            })

        return traffic_data
