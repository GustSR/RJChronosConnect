"""
Comando para fazer rollback de mudanças de sysname da OLT.

Este comando permite reverter mudanças de nome que causaram problemas,
restaurando o sysname anterior dentro de uma janela de tempo segura.
"""

import time
from typing import Dict, Any
from ..base_command import OLTCommand
from ...core.sysname_protection import sysname_protection
from ...core.logging import get_logger

logger = get_logger(__name__)


class RollbackSysnameCommand(OLTCommand):
    """
    Comando para fazer rollback de mudança de sysname da OLT.

    Permite reverter para o nome anterior dentro de uma janela de tempo
    limitada, com validações de segurança.
    """

    def execute(self, connection_manager, olt_version: str, **kwargs) -> Dict[str, Any]:
        """
        Executa rollback de mudança de sysname.

        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT
            **kwargs: Deve conter 'olt_id' e opcionalmente 'user_id', 'reason'

        Returns:
            Dict contendo resultado da operação
        """
        olt_id = kwargs.get('olt_id')
        user_id = kwargs.get('user_id')
        reason = kwargs.get('reason', 'Rollback solicitado via API')

        try:
            self._validate_input(**kwargs)

            # 1. Verificar se rollback é possível
            can_rollback, previous_sysname = sysname_protection.can_rollback(olt_id)

            if not can_rollback:
                return {
                    "success": False,
                    "message": "Rollback não disponível ou janela de tempo expirada",
                    "olt_id": olt_id,
                    "timestamp": int(time.time())
                }

            if not previous_sysname:
                return {
                    "success": False,
                    "message": "Sysname anterior não encontrado para rollback",
                    "olt_id": olt_id,
                    "timestamp": int(time.time())
                }

            # 2. Obter sysname atual
            current_sysname = self._get_current_sysname(connection_manager)
            logger.info(f"Iniciando rollback de sysname OLT {olt_id}: '{current_sysname}' → '{previous_sysname}'")

            # 3. Executar rollback na OLT
            command = f"sysname {previous_sysname}"
            raw_output = connection_manager.send_command(command)

            # 4. Verificar se rollback foi aplicado
            execution_result = self._parse_rollback_output(raw_output, olt_version, previous_sysname)

            # 5. Verificar sysname após rollback
            if execution_result.get('success'):
                verification_result = self._verify_sysname_change(connection_manager, previous_sysname)
                execution_result['verified'] = verification_result

                if not verification_result:
                    execution_result['success'] = False
                    execution_result['message'] = "Comando de rollback executado mas mudança não foi aplicada"

            # 6. Registrar rollback para auditoria
            sysname_protection.record_sysname_change(
                olt_id=olt_id,
                old_sysname=current_sysname,
                new_sysname=previous_sysname,
                success=execution_result.get('success', False),
                user_id=user_id,
                reason=f"ROLLBACK: {reason}"
            )

            # 7. Adicionar informações extras ao resultado
            execution_result.update({
                "rollback_from": current_sysname,
                "rollback_to": previous_sysname,
                "timestamp": int(time.time()),
                "olt_id": olt_id,
                "user_id": user_id,
                "reason": reason
            })

            if execution_result.get('success'):
                logger.info(f"Rollback de sysname executado com sucesso para OLT {olt_id}")
            else:
                logger.error(f"Falha no rollback de sysname para OLT {olt_id}")

            self._log_execution(command, execution_result.get('success', False))
            return execution_result

        except Exception as e:
            logger.error(f"Erro na execução de rollback de sysname: {e}")

            # Registrar falha no rollback
            if olt_id:
                sysname_protection.record_sysname_change(
                    olt_id=olt_id,
                    old_sysname=current_sysname if 'current_sysname' in locals() else 'Unknown',
                    new_sysname=previous_sysname if 'previous_sysname' in locals() else 'Unknown',
                    success=False,
                    user_id=user_id,
                    reason=f"ROLLBACK FALHOU: {str(e)}"
                )

            self._log_execution("rollback_sysname", False)
            raise

    def _parse_rollback_output(self, raw_output: str, olt_version: str, expected_sysname: str) -> Dict[str, Any]:
        """
        Processa a saída do comando de rollback de sysname.

        Args:
            raw_output: Saída bruta do comando CLI
            olt_version: Versão da OLT
            expected_sysname: Nome esperado após rollback

        Returns:
            Dict com resultado da operação
        """
        output_lower = raw_output.lower()
        success = True
        message = f"Rollback executado com sucesso para '{expected_sysname}'"

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
                message = f"Falha no rollback: {indicator}"
                break

        # Verificar se o comando foi aceito
        if not raw_output.strip():
            # Comando executado sem saída = sucesso típico
            success = True
            message = f"Rollback executado com sucesso para '{expected_sysname}'"
        elif "%" in raw_output:
            # Símbolo % geralmente indica erro em equipamentos Huawei
            success = False
            message = "Erro na execução do comando de rollback"

        return {
            "success": success,
            "message": message,
            "rollback_sysname": expected_sysname,
            "raw_output": raw_output.strip()
        }

    def _get_current_sysname(self, connection_manager) -> str:
        """Obtém o sysname atual da OLT via SSH."""
        try:
            output = connection_manager.send_command("display current-configuration | include sysname")

            for line in output.split('\n'):
                line = line.strip()
                if line.startswith('sysname '):
                    return line.replace('sysname ', '').strip()

            logger.warning("Sysname não encontrado na configuração")
            return "Unknown"

        except Exception as e:
            logger.error(f"Erro ao obter sysname atual: {e}")
            return "Error"

    def _verify_sysname_change(self, connection_manager, expected_sysname: str) -> bool:
        """Verifica se o rollback foi aplicado corretamente."""
        try:
            # Aguardar um pouco para mudança ser aplicada
            time.sleep(1)

            # Verificar sysname atual
            current_sysname = self._get_current_sysname(connection_manager)

            if current_sysname.lower() == expected_sysname.lower():
                logger.info(f"Rollback de sysname verificado com sucesso: {current_sysname}")
                return True
            else:
                logger.error(f"Verificação de rollback falhou - Esperado: {expected_sysname}, Atual: {current_sysname}")
                return False

        except Exception as e:
            logger.error(f"Erro na verificação de rollback de sysname: {e}")
            return False

    def _validate_input(self, **kwargs) -> bool:
        """
        Valida parâmetros para rollback de sysname.

        Args:
            **kwargs: Parâmetros a validar

        Returns:
            True se válidos

        Raises:
            ValueError: Se parâmetros inválidos
        """
        olt_id = kwargs.get('olt_id')

        if not olt_id:
            raise ValueError("Parâmetro 'olt_id' é obrigatório")

        if not isinstance(olt_id, int) or olt_id <= 0:
            raise ValueError("olt_id deve ser um inteiro positivo")

        return True


class SysnameAuditCommand(OLTCommand):
    """
    Comando para obter auditoria de mudanças de sysname.

    Retorna histórico completo de mudanças de nome de uma OLT específica.
    """

    def execute(self, connection_manager, olt_version: str, **kwargs) -> Dict[str, Any]:
        """
        Obtém histórico de mudanças de sysname de uma OLT.

        Args:
            connection_manager: Gerenciador de conexão SSH (não usado)
            olt_version: Versão da OLT (não usado)
            **kwargs: Deve conter 'olt_id'

        Returns:
            Dict contendo histórico de mudanças
        """
        try:
            self._validate_input(**kwargs)

            olt_id = kwargs.get('olt_id')

            # Obter histórico do sistema de proteção
            change_history = sysname_protection.get_change_history(olt_id)

            # Converter para formato serializável
            history_data = []
            for record in change_history:
                history_data.append({
                    "olt_id": record.olt_id,
                    "old_sysname": record.old_sysname,
                    "new_sysname": record.new_sysname,
                    "timestamp": record.timestamp.isoformat(),
                    "user_id": record.user_id,
                    "reason": record.reason,
                    "success": record.success,
                    "rollback_available": record.rollback_available
                })

            # Verificar se rollback está disponível
            can_rollback, rollback_to = sysname_protection.can_rollback(olt_id)

            result = {
                "success": True,
                "olt_id": olt_id,
                "change_history": history_data,
                "total_changes": len(history_data),
                "rollback_available": can_rollback,
                "rollback_to": rollback_to,
                "timestamp": int(time.time())
            }

            logger.info(f"Auditoria de sysname obtida para OLT {olt_id}: {len(history_data)} registros")
            self._log_execution("sysname_audit", True)
            return result

        except Exception as e:
            logger.error(f"Erro na obtenção de auditoria de sysname: {e}")
            self._log_execution("sysname_audit", False)
            return {
                "success": False,
                "message": f"Erro na auditoria: {str(e)}",
                "olt_id": kwargs.get('olt_id'),
                "timestamp": int(time.time())
            }

    def _validate_input(self, **kwargs) -> bool:
        """Valida parâmetros para auditoria."""
        olt_id = kwargs.get('olt_id')

        if not olt_id:
            raise ValueError("Parâmetro 'olt_id' é obrigatório")

        if not isinstance(olt_id, int) or olt_id <= 0:
            raise ValueError("olt_id deve ser um inteiro positivo")

        return True