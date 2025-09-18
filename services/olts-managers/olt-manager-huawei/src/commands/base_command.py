"""
Classe base para todos os comandos da OLT.

Este módulo contém a definição da classe base que todos os comandos
específicos da OLT devem herdar, garantindo interface consistente.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from ..core.logging import get_logger


class OLTCommand(ABC):
    """
    Classe base abstrata para todos os comandos da OLT.

    Define a interface padrão que todos os comandos devem implementar,
    garantindo consistência na execução e tratamento de resultados.
    """

    def __init__(self):
        """Inicializa o comando com logger configurado."""
        self.logger = get_logger(self.__class__.__name__)

    @abstractmethod
    def execute(self, connection_manager, olt_version: str, **kwargs) -> Dict[str, Any]:
        """
        Executa o comando na OLT.

        Args:
            connection_manager: Gerenciador de conexão SSH com a OLT
            olt_version: Versão da OLT para compatibilidade de comandos
            **kwargs: Parâmetros específicos do comando

        Returns:
            Dict contendo o resultado da execução do comando

        Raises:
            OLTException: Em caso de erro na execução
        """
        pass

    @abstractmethod
    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        """
        Processa a saída bruta do comando.

        Args:
            raw_output: Saída bruta retornada pela OLT
            olt_version: Versão da OLT para compatibilidade de parsing

        Returns:
            Dict com dados estruturados extraídos da saída

        Raises:
            OLTException: Em caso de erro no parsing
        """
        pass

    def _validate_input(self, **kwargs) -> bool:
        """
        Valida os parâmetros de entrada do comando.

        Args:
            **kwargs: Parâmetros a serem validados

        Returns:
            True se todos os parâmetros são válidos

        Raises:
            ValueError: Em caso de parâmetros inválidos
        """
        return True

    def _build_command(self, olt_version: str, **kwargs) -> str:
        """
        Constrói o comando específico para a versão da OLT.

        Args:
            olt_version: Versão da OLT
            **kwargs: Parâmetros específicos do comando

        Returns:
            String contendo o comando a ser executado

        Raises:
            NotImplementedError: Se a versão da OLT não é suportada
        """
        raise NotImplementedError(f"Comando não implementado para versão {olt_version}")

    def _log_execution(self, command: str, success: bool, execution_time: Optional[float] = None):
        """
        Registra a execução do comando no log.

        Args:
            command: Comando executado
            success: Se a execução foi bem-sucedida
            execution_time: Tempo de execução em segundos
        """
        status = "SUCCESS" if success else "FAILED"
        time_info = f" ({execution_time:.2f}s)" if execution_time else ""
        self.logger.info(f"Command {status}: {command}{time_info}")


class BaseCommand(OLTCommand):
    """
    Alias para compatibilidade com código legado.

    Mantém compatibilidade com comandos que usavam BaseCommand
    em vez de OLTCommand.
    """
    pass