"""
Comando para alterar o nome do sistema (hostname) da OLT.

Este comando executa o comando 'sysname' na OLT Huawei para definir
um nome amigável que será usado como identificador principal.
Inclui proteções avançadas para evitar problemas operacionais.
"""

import re
import time
from typing import Dict, Any
from ..base_command import OLTCommand
from ...core.sysname_protection import sysname_protection
from ...core.logging import get_logger

logger = get_logger(__name__)


class SetSysnameCommand(OLTCommand):
    """
    Comando para alterar o nome do sistema (sysname/hostname) da OLT.

    Executa o comando CLI 'sysname <nome>' na OLT Huawei,
    permitindo definir um identificador amigável para o equipamento.
    """

    def execute(self, connection_manager, olt_version: str, **kwargs) -> Dict[str, Any]:
        """
        Executa o comando para alterar o sysname da OLT com proteções avançadas.

        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT
            **kwargs: Deve conter 'sysname', 'olt_id' e opcionalmente 'user_id', 'force'

        Returns:
            Dict contendo resultado da operação
        """
        olt_id = kwargs.get('olt_id')
        new_sysname = kwargs.get('sysname')
        user_id = kwargs.get('user_id')
        force_change = kwargs.get('force', False)

        try:
            self._validate_input(**kwargs)

            # 1. Obter sysname atual
            current_sysname = self._get_current_sysname(connection_manager)
            logger.info(f"Iniciando mudança de sysname OLT {olt_id}: '{current_sysname}' → '{new_sysname}'")

            # 2. Executar validações de proteção (a menos que forçado)
            if not force_change:
                validation_result = sysname_protection.validate_sysname_change(
                    olt_id=olt_id,
                    current_sysname=current_sysname,
                    new_sysname=new_sysname,
                    user_id=user_id
                )

                if not validation_result.can_proceed:
                    # Registrar tentativa bloqueada
                    sysname_protection.record_sysname_change(
                        olt_id=olt_id,
                        old_sysname=current_sysname,
                        new_sysname=new_sysname,
                        success=False,
                        user_id=user_id,
                        reason="Bloqueado por validações de proteção"
                    )

                    return {
                        "success": False,
                        "message": "Mudança bloqueada por proteções de segurança",
                        "current_sysname": current_sysname,
                        "new_sysname": new_sysname,
                        "errors": validation_result.errors,
                        "warnings": validation_result.warnings,
                        "timestamp": int(time.time())
                    }

            # 3. Backup da configuração atual
            backup_result = self._backup_current_config(connection_manager)

            # 4. Executar mudança na OLT
            command = self._build_command(olt_version, **kwargs)
            raw_output = connection_manager.send_command(command)

            # 5. Verificar se mudança foi aplicada
            execution_result = self._parse_output(raw_output, olt_version, **kwargs)

            # 6. Verificar sysname após mudança
            if execution_result.get('success'):
                verification_result = self._verify_sysname_change(connection_manager, new_sysname)
                execution_result['verified'] = verification_result

                if not verification_result:
                    execution_result['success'] = False
                    execution_result['message'] = "Comando executado mas mudança não foi aplicada"

            # 7. Registrar resultado para auditoria
            sysname_protection.record_sysname_change(
                olt_id=olt_id,
                old_sysname=current_sysname,
                new_sysname=new_sysname,
                success=execution_result.get('success', False),
                user_id=user_id,
                reason=kwargs.get('reason', 'Mudança via API')
            )

            # 8. Adicionar informações extras ao resultado
            execution_result.update({
                "current_sysname": current_sysname,
                "backup_created": backup_result,
                "timestamp": int(time.time()),
                "olt_id": olt_id,
                "user_id": user_id
            })

            self._log_execution(command, execution_result.get('success', False))
            return execution_result

        except Exception as e:
            logger.error(f"Erro na execução de mudança de sysname: {e}")

            # Registrar falha
            if olt_id and new_sysname:
                sysname_protection.record_sysname_change(
                    olt_id=olt_id,
                    old_sysname=current_sysname if 'current_sysname' in locals() else 'Unknown',
                    new_sysname=new_sysname,
                    success=False,
                    user_id=user_id,
                    reason=f"Erro na execução: {str(e)}"
                )

            self._log_execution(command if 'command' in locals() else "set_sysname", False)
            raise

    def _build_command(self, olt_version: str, **kwargs) -> str:
        """
        Constrói comando para alterar sysname.

        Args:
            olt_version: Versão da OLT
            **kwargs: Parâmetros do comando

        Returns:
            String com comando CLI a ser executado
        """
        sysname = kwargs.get('sysname')

        # Comando para alterar sysname
        # Nota: Precisa estar em system-view mode
        return f"sysname {sysname}"

    def _parse_output(self, raw_output: str, olt_version: str, **kwargs) -> Dict[str, Any]:
        """
        Processa a saída do comando sysname.

        Args:
            raw_output: Saída bruta do comando CLI
            olt_version: Versão da OLT

        Returns:
            Dict com resultado da operação
        """
        output_lower = raw_output.lower()
        success = True
        message = "Sysname alterado com sucesso"

        # Verificar indicadores de erro
        error_indicators = [
            "error",
            "invalid",
            "failed",
            "incorrect",
            "syntax error",
            "command not found",
            "permission denied"
        ]

        for indicator in error_indicators:
            if indicator in output_lower:
                success = False
                message = f"Falha ao alterar sysname: {indicator}"
                break

        # Verificar se o comando foi aceito (saída típica: prompt muda ou sem erro)
        if not raw_output.strip():
            # Comando executado sem saída = sucesso típico
            success = True
            message = "Sysname alterado com sucesso"
        elif "%" in raw_output:
            # Símbolo % geralmente indica erro em equipamentos Huawei
            success = False
            message = "Erro na execução do comando sysname"

        return {
            "success": success,
            "message": message,
            "sysname": kwargs.get('sysname'),
            "raw_output": raw_output.strip()
        }

    def _validate_input(self, **kwargs) -> bool:
        """
        Valida parâmetros para alterar sysname.

        Args:
            **kwargs: Parâmetros a validar

        Returns:
            True se válidos

        Raises:
            ValueError: Se parâmetros inválidos
        """
        sysname = kwargs.get('sysname')

        if not sysname:
            raise ValueError("Parâmetro 'sysname' é obrigatório")

        if not isinstance(sysname, str):
            raise ValueError("sysname deve ser uma string")

        # Validar formato do sysname
        # Huawei OLT: 1-246 caracteres, alfanuméricos, hífen e underscore
        if not re.match(r'^[a-zA-Z0-9_-]+$', sysname):
            raise ValueError(
                "sysname deve conter apenas letras, números, hífen e underscore"
            )

        if len(sysname) < 1 or len(sysname) > 246:
            raise ValueError("sysname deve ter entre 1 e 246 caracteres")

        # Validar que não começa com hífen
        if sysname.startswith('-'):
            raise ValueError("sysname não pode começar com hífen")

        return True

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

    def _backup_current_config(self, connection_manager) -> bool:
        """
        Faz backup da configuração atual antes da mudança.

        Args:
            connection_manager: Gerenciador de conexão SSH

        Returns:
            True se backup foi criado com sucesso
        """
        try:
            # Comando para salvar configuração atual
            timestamp = int(time.time())
            backup_filename = f"backup_before_sysname_change_{timestamp}.cfg"

            save_command = f"save {backup_filename}"
            output = connection_manager.send_command(save_command)

            # Verificar se backup foi criado
            if "successfully" in output.lower() or "saved" in output.lower():
                logger.info(f"Backup da configuração criado: {backup_filename}")
                return True
            else:
                logger.warning(f"Backup pode ter falhado: {output}")
                return False

        except Exception as e:
            logger.error(f"Erro ao criar backup da configuração: {e}")
            return False

    def _verify_sysname_change(self, connection_manager, expected_sysname: str) -> bool:
        """
        Verifica se a mudança de sysname foi aplicada corretamente.

        Args:
            connection_manager: Gerenciador de conexão SSH
            expected_sysname: Nome esperado após a mudança

        Returns:
            True se mudança foi aplicada corretamente
        """
        try:
            # Aguardar um pouco para mudança ser aplicada
            time.sleep(1)

            # Verificar sysname atual
            current_sysname = self._get_current_sysname(connection_manager)

            if current_sysname.lower() == expected_sysname.lower():
                logger.info(f"Mudança de sysname verificada com sucesso: {current_sysname}")
                return True
            else:
                logger.error(f"Verificação falhou - Esperado: {expected_sysname}, Atual: {current_sysname}")
                return False

        except Exception as e:
            logger.error(f"Erro na verificação de mudança de sysname: {e}")
            return False