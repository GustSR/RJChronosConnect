"""
Comando para validar mudanças de sysname antes da execução.

Este comando implementa validações críticas para garantir que uma mudança
de nome de OLT pode ser realizada com segurança, incluindo verificações
de duplicidade, cooldown e impacto nos sistemas.
"""

import requests
from typing import Dict, Any, Optional
from ..base_command import OLTCommand
from ...core.sysname_protection import sysname_protection
from ...core.config import settings
from ...core.logging import get_logger

logger = get_logger(__name__)


class ValidateSysnameChangeCommand(OLTCommand):
    """
    Comando para validar se uma mudança de sysname pode ser realizada.

    Executa todas as verificações de segurança antes de permitir
    que uma mudança de nome seja aplicada na OLT.
    """

    def execute(self, connection_manager, olt_version: str, **kwargs) -> Dict[str, Any]:
        """
        Executa validação completa para mudança de sysname.

        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT
            **kwargs: Deve conter 'olt_id', 'new_sysname', opcionalmente 'user_id'

        Returns:
            Dict contendo resultado da validação
        """
        try:
            self._validate_input(**kwargs)

            olt_id = kwargs.get('olt_id')
            new_sysname = kwargs.get('new_sysname')
            user_id = kwargs.get('user_id')

            # Obter sysname atual da OLT
            current_sysname = self._get_current_sysname(connection_manager)

            # Executar validação usando o sistema de proteção
            validation_result = sysname_protection.validate_sysname_change(
                olt_id=olt_id,
                current_sysname=current_sysname,
                new_sysname=new_sysname,
                user_id=user_id
            )

            result = {
                "success": validation_result.is_valid,
                "can_proceed": validation_result.can_proceed,
                "current_sysname": current_sysname,
                "new_sysname": new_sysname,
                "errors": validation_result.errors,
                "warnings": validation_result.warnings,
                "cooldown_remaining": validation_result.cooldown_remaining,
                "validation_timestamp": int(time.time())
            }

            if validation_result.is_valid:
                logger.info(f"Validação de mudança aprovada para OLT {olt_id}: {current_sysname} → {new_sysname}")
                result["message"] = "Mudança de sysname aprovada para execução"
            else:
                logger.warning(f"Validação de mudança rejeitada para OLT {olt_id}: {validation_result.errors}")
                result["message"] = "Mudança de sysname rejeitada"

            self._log_execution("validate_sysname_change", validation_result.is_valid)
            return result

        except Exception as e:
            logger.error(f"Erro na validação de mudança de sysname: {e}")
            self._log_execution("validate_sysname_change", False)
            return {
                "success": False,
                "can_proceed": False,
                "message": f"Erro na validação: {str(e)}",
                "errors": [str(e)],
                "warnings": [],
                "validation_timestamp": int(time.time())
            }

    def _get_current_sysname(self, connection_manager) -> str:
        """
        Obtém o sysname atual da OLT via SSH.

        Args:
            connection_manager: Gerenciador de conexão SSH

        Returns:
            Sysname atual da OLT
        """
        try:
            # Comando para obter sysname atual
            output = connection_manager.send_command("display current-configuration | include sysname")

            # Processar saída para extrair sysname
            for line in output.split('\n'):
                line = line.strip()
                if line.startswith('sysname '):
                    return line.replace('sysname ', '').strip()

            # Se não encontrou sysname configurado, usar padrão
            logger.warning("Sysname não encontrado na configuração, usando padrão")
            return "OLT"

        except Exception as e:
            logger.error(f"Erro ao obter sysname atual: {e}")
            return "Unknown"

    def _validate_input(self, **kwargs) -> bool:
        """
        Valida parâmetros de entrada para validação.

        Args:
            **kwargs: Parâmetros a validar

        Returns:
            True se válidos

        Raises:
            ValueError: Se parâmetros inválidos
        """
        olt_id = kwargs.get('olt_id')
        new_sysname = kwargs.get('new_sysname')

        if not olt_id:
            raise ValueError("Parâmetro 'olt_id' é obrigatório")

        if not isinstance(olt_id, int) or olt_id <= 0:
            raise ValueError("olt_id deve ser um inteiro positivo")

        if not new_sysname:
            raise ValueError("Parâmetro 'new_sysname' é obrigatório")

        if not isinstance(new_sysname, str):
            raise ValueError("new_sysname deve ser uma string")

        return True


class GetSysnameCommand(OLTCommand):
    """
    Comando simples para obter o sysname atual da OLT.

    Útil para verificações e auditorias independentes.
    """

    def execute(self, connection_manager, olt_version: str, **kwargs) -> Dict[str, Any]:
        """
        Obtém o sysname atual da OLT.

        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT
            **kwargs: Parâmetros opcionais

        Returns:
            Dict contendo o sysname atual
        """
        try:
            sysname = self._get_current_sysname(connection_manager)

            result = {
                "success": True,
                "sysname": sysname,
                "message": "Sysname obtido com sucesso",
                "timestamp": int(time.time())
            }

            self._log_execution("get_sysname", True)
            return result

        except Exception as e:
            logger.error(f"Erro ao obter sysname: {e}")
            self._log_execution("get_sysname", False)
            return {
                "success": False,
                "sysname": None,
                "message": f"Erro ao obter sysname: {str(e)}",
                "timestamp": int(time.time())
            }

    def _get_current_sysname(self, connection_manager) -> str:
        """Obtém o sysname atual da OLT via SSH."""
        try:
            # Tentar diferentes comandos para diferentes versões
            commands = [
                "display current-configuration | include sysname",
                "display system",
                "show running-config | include hostname"
            ]

            for cmd in commands:
                try:
                    output = connection_manager.send_command(cmd)

                    # Processar saída para extrair sysname
                    for line in output.split('\n'):
                        line = line.strip()
                        if 'sysname ' in line.lower():
                            # Extrair nome após 'sysname'
                            parts = line.split()
                            for i, part in enumerate(parts):
                                if part.lower() == 'sysname' and i + 1 < len(parts):
                                    return parts[i + 1].strip()
                        elif 'hostname ' in line.lower():
                            # Extrair nome após 'hostname'
                            parts = line.split()
                            for i, part in enumerate(parts):
                                if part.lower() == 'hostname' and i + 1 < len(parts):
                                    return parts[i + 1].strip()

                except Exception as e:
                    logger.debug(f"Comando '{cmd}' falhou: {e}")
                    continue

            # Se nenhum comando funcionou, usar método alternativo
            logger.warning("Não foi possível determinar sysname pelos comandos padrão")
            return "Unknown"

        except Exception as e:
            logger.error(f"Erro geral ao obter sysname: {e}")
            return "Error"


import time  # Import necessário para timestamp