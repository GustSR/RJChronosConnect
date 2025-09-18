"""
Comando para obter service-ports via CLI.

Este comando obtém informações sobre service-ports configuradas
na OLT utilizando interface de linha de comando.
"""

import re
from typing import Dict, Any, List
from ..base_command import OLTCommand


class GetServicePortCliCommand(OLTCommand):
    """
    Comando para obter informações de service-ports via CLI.

    Executa comandos CLI na OLT para listar e obter detalhes
    das service-ports configuradas.
    """

    def execute(self, connection_manager, olt_version: str, **kwargs) -> Dict[str, Any]:
        """
        Executa o comando para obter service-ports.

        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT
            **kwargs: Parâmetros opcionais (port, ont_id, etc.)

        Returns:
            Dict contendo lista de service-ports encontradas
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
            self._log_execution(command if 'command' in locals() else "get_service_port", False)
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
        ont_id = kwargs.get('ont_id')

        if port and ont_id:
            # Obter service-ports de uma ONT específica
            return f"display service-port port {port} ont {ont_id}"
        else:
            # Obter todas as service-ports
            return "display service-port all"

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """
        Processa a saída do comando display service-port.

        Args:
            raw_output: Saída bruta do comando CLI
            olt_version: Versão da OLT

        Returns:
            Dict com service-ports estruturadas
        """
        service_ports = []

        # Padrão para linha de service-port
        # Exemplo: "  1    gpon-olt_1/1/1    1/1      1      100     up       up"
        port_pattern = r'(\d+)\s+(\S+)\s+(\d+/\d+)\s+(\d+)\s+(\d+)\s+(\w+)\s+(\w+)'

        lines = raw_output.split('\n')

        for line in lines:
            line = line.strip()
            match = re.search(port_pattern, line)

            if match:
                port_id, interface, user_port, ont_id, vlan_id, admin_state, oper_state = match.groups()

                service_port = {
                    "port_id": int(port_id),
                    "port_name": f"service-port-{port_id}",
                    "interface": interface,
                    "user_port": user_port,
                    "ont_id": int(ont_id),
                    "vlan_id": int(vlan_id),
                    "admin_state": admin_state,
                    "oper_state": oper_state,
                    "state": oper_state
                }

                service_ports.append(service_port)

        return {
            "service_ports": service_ports,
            "total_count": len(service_ports)
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
        ont_id = kwargs.get('ont_id')

        # Se port é fornecido, ont_id também deve ser
        if port and not ont_id:
            raise ValueError("ont_id é obrigatório quando port é especificado")

        if ont_id and not port:
            raise ValueError("port é obrigatório quando ont_id é especificado")

        return True