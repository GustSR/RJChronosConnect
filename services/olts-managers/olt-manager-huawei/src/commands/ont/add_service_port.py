"""
Comando para adicionar service-port via CLI.

Este comando adiciona uma nova service-port na OLT,
configurando VLAN e outros parâmetros de rede.
"""

import re
from typing import Dict, Any
from ..base_command import OLTCommand


class AddServicePortCommand(OLTCommand):
    """
    Comando para adicionar uma nova service-port na OLT.

    Executa comandos CLI para criar e configurar service-ports
    com parâmetros específicos de VLAN e QoS.
    """

    def execute(self, connection_manager, olt_version: str, **kwargs) -> Dict[str, Any]:
        """
        Executa o comando para adicionar service-port.

        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT
            **kwargs: Parâmetros da service-port (port, ont_id, vlan_id, etc.)

        Returns:
            Dict contendo resultado da operação
        """
        try:
            self._validate_input(**kwargs)
            command = self._build_command(olt_version, **kwargs)

            # Executar comando na OLT
            raw_output = connection_manager.send_command(command)

            # Processar resultado
            result = self._parse_output(raw_output, olt_version)

            self._log_execution(command, result.get('success', False))
            return result

        except Exception as e:
            self._log_execution(command if 'command' in locals() else "add_service_port", False)
            raise

    def _build_command(self, olt_version: str, **kwargs) -> str:
        """
        Constrói comando para adicionar service-port.

        Args:
            olt_version: Versão da OLT
            **kwargs: Parâmetros da service-port

        Returns:
            String com comando CLI a ser executado
        """
        port = kwargs.get('port')
        ont_id = kwargs.get('ont_id')
        vlan_id = kwargs.get('vlan_id')
        user_vlan = kwargs.get('user_vlan', vlan_id)
        gem_port = kwargs.get('gem_port', ont_id)
        traffic_profile = kwargs.get('traffic_profile', 'default')

        # Comando base para adicionar service-port
        command = f"service-port vlan {vlan_id} gpon {port} ont {ont_id}"

        # Adicionar parâmetros opcionais
        if user_vlan != vlan_id:
            command += f" gemport {gem_port} multi-service user-vlan {user_vlan}"
        else:
            command += f" gemport {gem_port}"

        # Adicionar perfil de tráfego se especificado
        if traffic_profile and traffic_profile != 'default':
            command += f" rx-cttr {traffic_profile} tx-cttr {traffic_profile}"

        return command

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """
        Processa a saída do comando add service-port.

        Args:
            raw_output: Saída bruta do comando CLI
            olt_version: Versão da OLT

        Returns:
            Dict com resultado da operação
        """
        output_lower = raw_output.lower()

        # Verificar se comando foi executado com sucesso
        success_indicators = [
            "successful",
            "succeeded",
            "command executed successfully",
            "service-port added"
        ]

        error_indicators = [
            "failed",
            "error",
            "invalid",
            "already exists",
            "conflict"
        ]

        success = False
        message = "Service-port creation status unknown"

        # Verificar indicadores de sucesso
        for indicator in success_indicators:
            if indicator in output_lower:
                success = True
                message = "Service-port created successfully"
                break

        # Verificar indicadores de erro
        if not success:
            for indicator in error_indicators:
                if indicator in output_lower:
                    success = False
                    message = f"Service-port creation failed: {indicator}"
                    break

        # Extrair ID da service-port se disponível
        service_port_id = None
        port_id_match = re.search(r'service-port\s+(\d+)', raw_output, re.IGNORECASE)
        if port_id_match:
            service_port_id = int(port_id_match.group(1))

        return {
            "success": success,
            "message": message,
            "service_port_id": service_port_id,
            "raw_output": raw_output.strip()
        }

    def _validate_input(self, **kwargs) -> bool:
        """
        Valida parâmetros obrigatórios para criar service-port.

        Args:
            **kwargs: Parâmetros a validar

        Returns:
            True se válidos

        Raises:
            ValueError: Se parâmetros obrigatórios ausentes ou inválidos
        """
        required_params = ['port', 'ont_id', 'vlan_id']

        for param in required_params:
            if param not in kwargs or kwargs[param] is None:
                raise ValueError(f"Parâmetro obrigatório ausente: {param}")

        # Validar tipos e valores
        port = kwargs.get('port')
        ont_id = kwargs.get('ont_id')
        vlan_id = kwargs.get('vlan_id')

        if not isinstance(ont_id, int) or ont_id < 1 or ont_id > 128:
            raise ValueError("ont_id deve ser um inteiro entre 1 e 128")

        if not isinstance(vlan_id, int) or vlan_id < 1 or vlan_id > 4094:
            raise ValueError("vlan_id deve ser um inteiro entre 1 e 4094")

        # Validar formato da porta
        if not isinstance(port, str) or not re.match(r'^\d+/\d+/\d+$', port):
            raise ValueError("port deve estar no formato frame/slot/port (ex: 0/1/1)")

        return True