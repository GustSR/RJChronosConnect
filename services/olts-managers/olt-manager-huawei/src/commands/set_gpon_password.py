# -*- coding: utf-8 -*-
"""
Comando para configurar senha de autenticação GPON na interface.
"""

from typing import Dict, Any
from .base_command import BaseCommand
from ..core.logging import get_logger

logger = get_logger(__name__)

class SetGponPasswordCommand(BaseCommand):
    """
    Configura senha de autenticação para interface GPON.
    """
    
    def __init__(self, frame: int, slot: int, password: str):
        """
        Inicializa comando para configurar senha GPON.
        
        Args:
            frame: Frame da interface GPON
            slot: Slot da interface GPON  
            password: Senha para autenticação (8-16 caracteres)
        """
        self.frame = frame
        self.slot = slot
        self.password = password
        
    def execute(self, connection_manager, olt_version: str = None) -> Dict[str, Any]:
        """
        Executa configuração de senha GPON.
        
        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT (opcional)
            
        Returns:
            Resultado da configuração
        """
        try:
            logger.info(f"Configurando senha GPON para interface {self.frame}/{self.slot}")
            
            # Comandos para configurar senha GPON
            commands = [
                "config",
                f"interface gpon {self.frame}/{self.slot}",
                f"gpon-password cipher {self.password}",
                "commit",
                "quit",
                "quit"
            ]
            
            # Executa comandos sequencialmente
            results = []
            for cmd in commands:
                logger.debug(f"Executando comando: {cmd}")
                output = connection_manager.send_command(cmd)
                results.append(output)
                
                # Verifica se houve erro
                if "Error" in output or "Failed" in output:
                    logger.error(f"Erro ao executar comando '{cmd}': {output}")
                    raise Exception(f"Falha na configuração: {output}")
            
            logger.info(f"Senha GPON configurada com sucesso para {self.frame}/{self.slot}")
            
            return {
                "status": "success",
                "message": f"Senha GPON configurada com sucesso para interface {self.frame}/{self.slot}",
                "interface": f"{self.frame}/{self.slot}",
                "password_length": len(self.password),
                "commands_executed": len(commands)
            }
            
        except Exception as e:
            error_msg = f"Falha ao configurar senha GPON: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "message": error_msg,
                "interface": f"{self.frame}/{self.slot}"
            }