# -*- coding: utf-8 -*-
"""
Comandos para gerenciamento completo de VLANs na OLT.
"""

from typing import Dict, Any, List
from ..base_command import BaseCommand
from ...core.logging import get_logger

logger = get_logger(__name__)

class CreateVlanCommand(BaseCommand):
    """
    Cria uma VLAN na OLT.
    """
    
    def __init__(self, vlan_id: int, description: str = "", vlan_type: str = "smart"):
        """
        Inicializa comando para criar VLAN.
        
        Args:
            vlan_id: ID da VLAN (1-4094)
            description: Descrição da VLAN
            vlan_type: Tipo da VLAN (smart, standard)
        """
        self.vlan_id = vlan_id
        self.description = description
        self.vlan_type = vlan_type
        
    def execute(self, connection_manager, olt_version: str = None) -> Dict[str, Any]:
        """
        Executa criação da VLAN.
        
        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT (opcional)
            
        Returns:
            Resultado da criação
        """
        try:
            logger.info(f"Criando VLAN {self.vlan_id} ({self.vlan_type})")
            
            # Validação do ID da VLAN
            if not (1 <= self.vlan_id <= 4094):
                raise ValueError("VLAN ID deve estar entre 1 e 4094")
            
            # Comandos para criar VLAN
            commands = [
                "config",
                f"vlan {self.vlan_id} {self.vlan_type}"
            ]
            
            # Adiciona descrição se fornecida
            if self.description:
                commands.append(f"vlan desc {self.vlan_id} \"{self.description}\"")
            
            commands.extend(["quit"])
            
            # Executa comandos
            results = []
            for cmd in commands:
                logger.debug(f"Executando comando: {cmd}")
                output = connection_manager.send_command(cmd)
                results.append(output)
                
                if "Error" in output or "Failed" in output:
                    logger.error(f"Erro ao executar comando '{cmd}': {output}")
                    raise Exception(f"Falha na criação da VLAN: {output}")
            
            logger.info(f"VLAN {self.vlan_id} criada com sucesso")
            
            return {
                "status": "success",
                "message": f"VLAN {self.vlan_id} criada com sucesso",
                "vlan_id": self.vlan_id,
                "description": self.description,
                "type": self.vlan_type
            }
            
        except Exception as e:
            error_msg = f"Falha ao criar VLAN {self.vlan_id}: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "message": error_msg,
                "vlan_id": self.vlan_id
            }


class DeleteVlanCommand(BaseCommand):
    """
    Remove uma VLAN da OLT.
    """
    
    def __init__(self, vlan_id: int):
        """
        Inicializa comando para remover VLAN.
        
        Args:
            vlan_id: ID da VLAN a ser removida
        """
        self.vlan_id = vlan_id
        
    def execute(self, connection_manager, olt_version: str = None) -> Dict[str, Any]:
        """
        Executa remoção da VLAN.
        
        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT (opcional)
            
        Returns:
            Resultado da remoção
        """
        try:
            logger.info(f"Removendo VLAN {self.vlan_id}")
            
            # Comandos para remover VLAN
            commands = [
                "config",
                f"undo vlan {self.vlan_id}",
                "quit"
            ]
            
            # Executa comandos
            for cmd in commands:
                logger.debug(f"Executando comando: {cmd}")
                output = connection_manager.send_command(cmd)
                
                if "Error" in output or "Failed" in output:
                    logger.error(f"Erro ao executar comando '{cmd}': {output}")
                    raise Exception(f"Falha na remoção da VLAN: {output}")
            
            logger.info(f"VLAN {self.vlan_id} removida com sucesso")
            
            return {
                "status": "success",
                "message": f"VLAN {self.vlan_id} removida com sucesso",
                "vlan_id": self.vlan_id
            }
            
        except Exception as e:
            error_msg = f"Falha ao remover VLAN {self.vlan_id}: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "message": error_msg,
                "vlan_id": self.vlan_id
            }


class AssignPortToVlanCommand(BaseCommand):
    """
    Associa uma porta a uma VLAN.
    """
    
    def __init__(self, vlan_id: int, frame: int, slot: int, port: int):
        """
        Inicializa comando para associar porta à VLAN.
        
        Args:
            vlan_id: ID da VLAN
            frame: Frame da porta
            slot: Slot da porta
            port: Número da porta
        """
        self.vlan_id = vlan_id
        self.frame = frame
        self.slot = slot
        self.port = port
        
    def execute(self, connection_manager, olt_version: str = None) -> Dict[str, Any]:
        """
        Executa associação da porta à VLAN.
        
        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT (opcional)
            
        Returns:
            Resultado da associação
        """
        try:
            port_identifier = f"{self.frame}/{self.slot}/{self.port}"
            logger.info(f"Associando porta {port_identifier} à VLAN {self.vlan_id}")
            
            # Comandos para associar porta à VLAN
            commands = [
                "config",
                f"port vlan {self.vlan_id} {self.frame}/{self.slot} {self.port}",
                "quit"
            ]
            
            # Executa comandos
            for cmd in commands:
                logger.debug(f"Executando comando: {cmd}")
                output = connection_manager.send_command(cmd)
                
                if "Error" in output or "Failed" in output:
                    logger.error(f"Erro ao executar comando '{cmd}': {output}")
                    raise Exception(f"Falha na associação: {output}")
            
            logger.info(f"Porta {port_identifier} associada à VLAN {self.vlan_id} com sucesso")
            
            return {
                "status": "success",
                "message": f"Porta {port_identifier} associada à VLAN {self.vlan_id} com sucesso",
                "vlan_id": self.vlan_id,
                "port": port_identifier
            }
            
        except Exception as e:
            error_msg = f"Falha ao associar porta à VLAN: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "message": error_msg,
                "vlan_id": self.vlan_id,
                "port": f"{self.frame}/{self.slot}/{self.port}"
            }