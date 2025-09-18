"""
Comando para obter endereços MAC via CLI.

Este comando obtém informações sobre endereços MAC aprendidos
na OLT utilizando interface de linha de comando.
"""

import re
from typing import Dict, Any, List
from datetime import datetime
from ..base_command import OLTCommand


class GetMacAddressCliCommand(OLTCommand):
    """
    Comando para obter endereços MAC aprendidos via CLI.

    Executa comandos CLI na OLT para listar endereços MAC
    aprendidos em portas específicas ou globalmente.
    """

    def execute(self, connection_manager, olt_version: str, **kwargs) -> Dict[str, Any]:
        """
        Executa o comando para obter endereços MAC.

        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT
            **kwargs: Parâmetros opcionais (port, vlan_id, etc.)

        Returns:
            Dict contendo lista de endereços MAC encontrados
        """
        try:
            self._validate_input(**kwargs)
            command = self._build_command(olt_version, **kwargs)

            # Executar comando na OLT
            raw_output = connection_manager.send_command(command)

            # Processar resultado
            result = self._parse_output(raw_output, olt_version)

            self._log_execution(command, True)
            return result

        except Exception as e:
            self._log_execution(command if 'command' in locals() else "get_mac_address", False)
            raise

    def _build_command(self, olt_version: str, **kwargs) -> str:
        """
        Constrói comando CLI específico para a versão da OLT.

        Args:
            olt_version: Versão da OLT
            **kwargs: Parâmetros do comando

        Returns:
            String com comando CLI a ser executado
        """
        port = kwargs.get('port')
        vlan_id = kwargs.get('vlan_id')

        # Comando base
        command = "display mac-address"

        # Adicionar filtros se especificados
        if port:
            command += f" port {port}"

        if vlan_id:
            command += f" vlan {vlan_id}"

        # Se nenhum filtro especificado, usar 'all'
        if not port and not vlan_id:
            command += " all"

        return command

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """
        Processa a saída do comando display mac-address.

        Args:
            raw_output: Saída bruta do comando CLI
            olt_version: Versão da OLT

        Returns:
            Dict com endereços MAC estruturados
        """
        mac_addresses = []

        # Padrão para linha de MAC address
        # Exemplo: "aabb-ccdd-eeff  100   gpon-olt_1/1/1     dynamic  aging"
        mac_pattern = r'([0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4})\s+(\d+)\s+(\S+)\s+(\w+)\s+(\w+)'

        lines = raw_output.split('\n')

        for line in lines:
            line = line.strip()
            match = re.search(mac_pattern, line)

            if match:
                mac_addr, vlan_id, port_info, status, learning_type = match.groups()

                # Normalizar MAC address (remover hífen e adicionar dois pontos)
                normalized_mac = mac_addr.replace('-', '').upper()
                formatted_mac = ':'.join([normalized_mac[i:i+2] for i in range(0, 12, 2)])

                # Extrair informações da porta
                ont_id = None
                port_type = "unknown"

                if "gpon" in port_info.lower():
                    port_type = "gpon"
                    # Tentar extrair ONT ID se disponível
                    ont_match = re.search(r'ont[_\s]*(\d+)', line, re.IGNORECASE)
                    if ont_match:
                        ont_id = int(ont_match.group(1))

                mac_info = {
                    "mac_address": formatted_mac,
                    "vlan_id": int(vlan_id),
                    "port": port_info,
                    "ont_id": ont_id,
                    "status": status,
                    "port_type": port_type,
                    "learning_type": learning_type,
                    "learned_time": datetime.now().isoformat()  # Aproximação
                }

                mac_addresses.append(mac_info)

        return {
            "mac_addresses": mac_addresses,
            "total_count": len(mac_addresses)
        }

    def _validate_input(self, **kwargs) -> bool:
        """
        Valida parâmetros de entrada.

        Args:
            **kwargs: Parâmetros a validar

        Returns:
            True se válidos

        Raises:
            ValueError: Se parâmetros inválidos
        """
        port = kwargs.get('port')
        vlan_id = kwargs.get('vlan_id')

        # Validar formato da porta se fornecida
        if port and not re.match(r'^\d+/\d+/\d+$', port):
            raise ValueError("port deve estar no formato frame/slot/port (ex: 0/1/1)")

        # Validar VLAN ID se fornecida
        if vlan_id is not None:
            if not isinstance(vlan_id, int) or vlan_id < 1 or vlan_id > 4094:
                raise ValueError("vlan_id deve ser um inteiro entre 1 e 4094")

        return True