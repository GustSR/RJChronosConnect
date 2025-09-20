"""
Sistema de proteção para mudanças de sysname (hostname) de OLTs.

Este módulo implementa proteções críticas para evitar problemas operacionais
ao alterar o nome de identificação de uma OLT, incluindo validações,
cooldowns, auditoria e transições suaves.
"""

import time
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass, field

from .config import settings
from .logging import get_logger

logger = get_logger(__name__)


@dataclass
class SysnameChangeRecord:
    """Registro de mudança de sysname para auditoria."""
    olt_id: int
    old_sysname: str
    new_sysname: str
    timestamp: datetime
    user_id: Optional[str] = None
    reason: Optional[str] = None
    success: bool = False
    rollback_available: bool = True


@dataclass
class SysnameValidationResult:
    """Resultado da validação de mudança de sysname."""
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    can_proceed: bool = True
    cooldown_remaining: Optional[int] = None


class SysnameProtectionManager:
    """
    Gerenciador de proteções para mudanças de sysname.

    Implementa validações, cooldowns, auditoria e transições suaves
    para evitar problemas operacionais em mudanças de nome de OLT.
    """

    def __init__(self):
        self.change_history: Dict[int, List[SysnameChangeRecord]] = {}
        self.cooldown_period = timedelta(hours=24)  # Cooldown padrão de 24h
        self.backend_api_url = settings.backend_api_url

    def validate_sysname_change(
        self,
        olt_id: int,
        current_sysname: str,
        new_sysname: str,
        user_id: Optional[str] = None
    ) -> SysnameValidationResult:
        """
        Valida se uma mudança de sysname pode ser realizada com segurança.

        Args:
            olt_id: ID da OLT
            current_sysname: Nome atual da OLT
            new_sysname: Novo nome desejado
            user_id: ID do usuário solicitando a mudança

        Returns:
            Resultado da validação com erros e avisos
        """
        result = SysnameValidationResult(is_valid=True)

        try:
            # 1. Validar formato do novo sysname
            format_errors = self._validate_sysname_format(new_sysname)
            result.errors.extend(format_errors)

            # 2. Verificar se novo nome já está em uso
            duplicate_error = self._check_sysname_duplicate(olt_id, new_sysname)
            if duplicate_error:
                result.errors.append(duplicate_error)

            # 3. Verificar cooldown
            cooldown_result = self._check_cooldown_period(olt_id)
            if not cooldown_result[0]:
                result.errors.append(f"Mudança não permitida. Cooldown ativo por mais {cooldown_result[1]} segundos")
                result.cooldown_remaining = cooldown_result[1]
                result.can_proceed = False

            # 4. Verificar se não é uma mudança trivial
            if current_sysname.lower() == new_sysname.lower():
                result.errors.append("O novo sysname é idêntico ao atual")

            # 5. Verificar impacto em sistemas dependentes
            impact_warnings = self._check_system_impact(olt_id, current_sysname, new_sysname)
            result.warnings.extend(impact_warnings)

            # 6. Validar se OLT está operacional
            operational_error = self._check_olt_operational_status(olt_id)
            if operational_error:
                result.errors.append(operational_error)

            # Determinar se pode prosseguir
            result.is_valid = len(result.errors) == 0
            result.can_proceed = result.is_valid

            if not result.is_valid:
                logger.warning(f"Validação de mudança de sysname falhou para OLT {olt_id}: {result.errors}")

            return result

        except Exception as e:
            logger.error(f"Erro inesperado na validação de sysname para OLT {olt_id}: {e}")
            result.is_valid = False
            result.can_proceed = False
            result.errors.append(f"Erro interno na validação: {str(e)}")
            return result

    def _validate_sysname_format(self, sysname: str) -> List[str]:
        """Valida formato do sysname usando regras mais rigorosas."""
        errors = []

        if not sysname or not sysname.strip():
            errors.append("Sysname não pode estar vazio")
            return errors

        sysname = sysname.strip()

        # Validar comprimento
        if len(sysname) < 3:
            errors.append("Sysname deve ter pelo menos 3 caracteres")
        elif len(sysname) > 246:
            errors.append("Sysname não pode ter mais que 246 caracteres")

        # Validar caracteres permitidos
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', sysname):
            errors.append("Sysname deve conter apenas letras, números, hífen e underscore")

        # Validar início
        if sysname.startswith('-'):
            errors.append("Sysname não pode começar com hífen")

        if sysname.startswith('_'):
            errors.append("Sysname não pode começar com underscore")

        # Validar se não é apenas números
        if sysname.isdigit():
            errors.append("Sysname não pode ser apenas números")

        # Validar palavras reservadas estendidas
        reserved_words = [
            'huawei', 'console', 'aux', 'vty', 'system', 'default',
            'config', 'interface', 'vlan', 'ip', 'snmp', 'trap',
            'admin', 'root', 'olt', 'switch', 'router', 'management'
        ]

        if sysname.lower() in reserved_words:
            errors.append(f'"{sysname}" é uma palavra reservada')

        # Validar padrões problemáticos
        problematic_patterns = [
            r'^\d+\.\d+\.\d+\.\d+$',  # IP address
            r'^[0-9a-fA-F]{12}$',     # MAC address
            r'^test|tmp|temp',        # Nomes temporários
        ]

        for pattern in problematic_patterns:
            if re.match(pattern, sysname, re.IGNORECASE):
                errors.append(f"Sysname não pode seguir padrão '{pattern}'")

        return errors

    def _check_sysname_duplicate(self, current_olt_id: int, new_sysname: str) -> Optional[str]:
        """Verifica se o sysname já está em uso por outra OLT."""
        try:
            response = requests.get(
                f"{self.backend_api_url}/olts",
                params={"name": new_sysname},
                timeout=5
            )

            if response.status_code == 200:
                olts_data = response.json()
                if olts_data and len(olts_data) > 0:
                    # Verificar se é uma OLT diferente
                    for olt in olts_data:
                        if olt.get('id') != current_olt_id:
                            return f"Sysname '{new_sysname}' já está em uso pela OLT ID {olt.get('id')}"

            return None

        except requests.RequestException as e:
            logger.warning(f"Não foi possível verificar duplicidade no backend: {e}")
            return "Não foi possível verificar duplicidade (backend indisponível)"
        except Exception as e:
            logger.error(f"Erro inesperado ao verificar duplicidade: {e}")
            return f"Erro na verificação de duplicidade: {str(e)}"

    def _check_cooldown_period(self, olt_id: int) -> Tuple[bool, int]:
        """
        Verifica se a OLT está em período de cooldown.

        Returns:
            Tuple (can_change: bool, remaining_seconds: int)
        """
        if olt_id not in self.change_history:
            return True, 0

        history = self.change_history[olt_id]
        if not history:
            return True, 0

        # Buscar última mudança bem-sucedida
        last_successful_change = None
        for record in reversed(history):
            if record.success:
                last_successful_change = record
                break

        if not last_successful_change:
            return True, 0

        # Calcular tempo restante de cooldown
        time_since_change = datetime.now() - last_successful_change.timestamp
        if time_since_change < self.cooldown_period:
            remaining = self.cooldown_period - time_since_change
            return False, int(remaining.total_seconds())

        return True, 0

    def _check_system_impact(self, olt_id: int, old_name: str, new_name: str) -> List[str]:
        """Verifica impacto potencial em sistemas dependentes."""
        warnings = []

        # Avisar sobre routing keys do RabbitMQ
        warnings.append(
            f"Routing keys RabbitMQ mudarão de 'olt.{old_name.lower()}.*' "
            f"para 'olt.{new_name.lower()}.*'"
        )

        # Avisar sobre monitoramento
        warnings.append(
            "Dashboards e alertas baseados no nome da OLT podem ser afetados"
        )

        # Avisar sobre scripts e automações
        warnings.append(
            "Scripts externos que dependem do nome da OLT devem ser atualizados"
        )

        # Avisar sobre histórico
        warnings.append(
            "Histórico de eventos será fragmentado entre nome antigo e novo"
        )

        return warnings

    def _check_olt_operational_status(self, olt_id: int) -> Optional[str]:
        """Verifica se a OLT está operacional para mudanças."""
        try:
            response = requests.get(
                f"{self.backend_api_url}/olts/{olt_id}/status",
                timeout=5
            )

            if response.status_code == 200:
                status_data = response.json()
                if status_data.get('status') != 'active':
                    return f"OLT está em status '{status_data.get('status')}' e não pode ter o nome alterado"
            elif response.status_code == 404:
                return f"OLT com ID {olt_id} não encontrada no sistema"
            else:
                logger.warning(f"Não foi possível verificar status da OLT {olt_id}")

            return None

        except requests.RequestException as e:
            logger.warning(f"Não foi possível verificar status da OLT {olt_id}: {e}")
            return None  # Não bloquear por problemas de rede
        except Exception as e:
            logger.error(f"Erro inesperado ao verificar status da OLT {olt_id}: {e}")
            return f"Erro na verificação de status: {str(e)}"

    def record_sysname_change(
        self,
        olt_id: int,
        old_sysname: str,
        new_sysname: str,
        success: bool,
        user_id: Optional[str] = None,
        reason: Optional[str] = None
    ) -> SysnameChangeRecord:
        """Registra uma mudança de sysname para auditoria."""
        record = SysnameChangeRecord(
            olt_id=olt_id,
            old_sysname=old_sysname,
            new_sysname=new_sysname,
            timestamp=datetime.now(),
            user_id=user_id,
            reason=reason,
            success=success
        )

        if olt_id not in self.change_history:
            self.change_history[olt_id] = []

        self.change_history[olt_id].append(record)

        # Manter apenas últimos 50 registros por OLT
        if len(self.change_history[olt_id]) > 50:
            self.change_history[olt_id] = self.change_history[olt_id][-50:]

        logger.info(
            f"Mudança de sysname registrada - OLT {olt_id}: "
            f"'{old_sysname}' → '{new_sysname}' "
            f"(Sucesso: {success}, Usuário: {user_id})"
        )

        return record

    def get_change_history(self, olt_id: int) -> List[SysnameChangeRecord]:
        """Obtém histórico de mudanças de uma OLT específica."""
        return self.change_history.get(olt_id, [])

    def can_rollback(self, olt_id: int) -> Tuple[bool, Optional[str]]:
        """
        Verifica se é possível fazer rollback da última mudança.

        Returns:
            Tuple (can_rollback: bool, previous_sysname: Optional[str])
        """
        if olt_id not in self.change_history:
            return False, None

        history = self.change_history[olt_id]
        if len(history) < 1:
            return False, None

        last_change = history[-1]
        if not last_change.success or not last_change.rollback_available:
            return False, None

        # Verificar se rollback ainda está dentro do período permitido (ex: 1 hora)
        rollback_window = timedelta(hours=1)
        if datetime.now() - last_change.timestamp > rollback_window:
            return False, None

        return True, last_change.old_sysname


# Instância global do gerenciador de proteção
sysname_protection = SysnameProtectionManager()