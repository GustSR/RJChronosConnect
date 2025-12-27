# -*- coding: utf-8 -*-
"""
Comandos para gerenciamento de usuários na OLT.
"""

from typing import Dict, Any, List, Literal
from ..base_command import BaseCommand
from ...core.logging import get_logger

logger = get_logger(__name__)

class CreateUserCommand(BaseCommand):
    """
    Cria um usuário na OLT.
    """
    
    def __init__(self, username: str, password: str, 
                 service_type: Literal["ssh", "telnet", "ftp", "web"] = "ssh",
                 privilege_level: int = 15):
        """
        Inicializa comando para criar usuário.
        
        Args:
            username: Nome do usuário
            password: Senha do usuário  
            service_type: Tipo de serviço (ssh, telnet, ftp, web)
            privilege_level: Nível de privilégio (0-15)
        """
        self.username = username
        self.password = password
        self.service_type = service_type
        self.privilege_level = privilege_level
        
    def execute(self, connection_manager, olt_version: str = None) -> Dict[str, Any]:
        """
        Executa criação do usuário.
        
        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT (opcional)
            
        Returns:
            Resultado da criação
        """
        try:
            logger.info(f"Criando usuário {self.username} com serviço {self.service_type}")
            
            # Validação do nível de privilégio
            if not (0 <= self.privilege_level <= 15):
                raise ValueError("Nível de privilégio deve estar entre 0 e 15")
            
            # Comandos para criar usuário
            commands = [
                "config",
                "aaa",
                f"local-user {self.username} password cipher {self.password}",
                f"local-user {self.username} service-type {self.service_type}",
                f"local-user {self.username} privilege level {self.privilege_level}",
                "quit",
                "quit"
            ]
            
            # Executa comandos
            for cmd in commands:
                logger.debug(f"Executando comando: {cmd}")
                output = connection_manager.send_command(cmd)
                
                if "Error" in output or "Failed" in output:
                    logger.error(f"Erro ao executar comando '{cmd}': {output}")
                    raise Exception(f"Falha na criação do usuário: {output}")
            
            logger.info(f"Usuário {self.username} criado com sucesso")
            
            return {
                "status": "success",
                "message": f"Usuário {self.username} criado com sucesso",
                "username": self.username,
                "service_type": self.service_type,
                "privilege_level": self.privilege_level
            }
            
        except Exception as e:
            error_msg = f"Falha ao criar usuário {self.username}: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "message": error_msg,
                "username": self.username
            }


class DeleteUserCommand(BaseCommand):
    """
    Remove um usuário da OLT.
    """
    
    def __init__(self, username: str):
        """
        Inicializa comando para remover usuário.
        
        Args:
            username: Nome do usuário a ser removido
        """
        self.username = username
        
    def execute(self, connection_manager, olt_version: str = None) -> Dict[str, Any]:
        """
        Executa remoção do usuário.
        
        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT (opcional)
            
        Returns:
            Resultado da remoção
        """
        try:
            logger.info(f"Removendo usuário {self.username}")
            
            # Comandos para remover usuário
            commands = [
                "config",
                "aaa",
                f"undo local-user {self.username}",
                "quit",
                "quit"
            ]
            
            # Executa comandos
            for cmd in commands:
                logger.debug(f"Executando comando: {cmd}")
                output = connection_manager.send_command(cmd)
                
                if "Error" in output or "Failed" in output:
                    logger.error(f"Erro ao executar comando '{cmd}': {output}")
                    raise Exception(f"Falha na remoção do usuário: {output}")
            
            logger.info(f"Usuário {self.username} removido com sucesso")
            
            return {
                "status": "success",
                "message": f"Usuário {self.username} removido com sucesso",
                "username": self.username
            }
            
        except Exception as e:
            error_msg = f"Falha ao remover usuário {self.username}: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "message": error_msg,
                "username": self.username
            }


class ChangeUserPasswordCommand(BaseCommand):
    """
    Altera senha de um usuário.
    """
    
    def __init__(self, username: str, new_password: str):
        """
        Inicializa comando para alterar senha.
        
        Args:
            username: Nome do usuário
            new_password: Nova senha
        """
        self.username = username
        self.new_password = new_password
        
    def execute(self, connection_manager, olt_version: str = None) -> Dict[str, Any]:
        """
        Executa alteração da senha.
        
        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT (opcional)
            
        Returns:
            Resultado da alteração
        """
        try:
            logger.info(f"Alterando senha do usuário {self.username}")
            
            # Comandos para alterar senha
            commands = [
                "config",
                "aaa",
                f"local-user {self.username} password cipher {self.new_password}",
                "quit",
                "quit"
            ]
            
            # Executa comandos
            for cmd in commands:
                logger.debug(f"Executando comando: {cmd}")
                output = connection_manager.send_command(cmd)
                
                if "Error" in output or "Failed" in output:
                    logger.error(f"Erro ao executar comando '{cmd}': {output}")
                    raise Exception(f"Falha na alteração da senha: {output}")
            
            logger.info(f"Senha do usuário {self.username} alterada com sucesso")
            
            return {
                "status": "success",
                "message": f"Senha do usuário {self.username} alterada com sucesso",
                "username": self.username
            }
            
        except Exception as e:
            error_msg = f"Falha ao alterar senha do usuário {self.username}: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "message": error_msg,
                "username": self.username
            }