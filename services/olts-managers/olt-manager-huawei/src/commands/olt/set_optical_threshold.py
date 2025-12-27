# -*- coding: utf-8 -*-
"""
Comando para configurar thresholds de alarme do módulo óptico.
"""

from typing import Dict, Any, Literal
from ..base_command import BaseCommand
from ...core.logging import get_logger

logger = get_logger(__name__)

class SetOpticalThresholdCommand(BaseCommand):
    """
    Configura thresholds de alarme para módulo óptico.
    """
    
    def __init__(self, frame: int, slot: int, port: int, 
                 parameter: Literal["rx-power", "tx-power", "bias", "temperature", "voltage"],
                 limit_type: Literal["lower-limit", "upper-limit"],
                 value: float):
        """
        Inicializa comando para configurar threshold óptico.
        
        Args:
            frame: Frame da interface
            slot: Slot da interface
            port: Porta da interface
            parameter: Parâmetro a configurar (rx-power, tx-power, bias, temperature, voltage)
            limit_type: Tipo de limite (lower-limit, upper-limit)
            value: Valor do threshold
        """
        self.frame = frame
        self.slot = slot
        self.port = port
        self.parameter = parameter
        self.limit_type = limit_type
        self.value = value
        
    def execute(self, connection_manager, olt_version: str = None) -> Dict[str, Any]:
        """
        Executa configuração de threshold óptico.
        
        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT (opcional)
            
        Returns:
            Resultado da configuração
        """
        try:
            interface = f"{self.frame}/{self.slot}/{self.port}"
            logger.info(f"Configurando threshold {self.parameter} {self.limit_type}={self.value} para interface {interface}")
            
            # Validação de valores por parâmetro
            self._validate_threshold_value()
            
            # Comandos para configurar threshold
            commands = [
                "config",
                f"interface gpon {self.frame}/{self.slot}",
                f"optical-module threshold {self.parameter} {self.limit_type} {self.value}",
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
                if "Error" in output or "Failed" in output or "Invalid" in output:
                    logger.error(f"Erro ao executar comando '{cmd}': {output}")
                    raise Exception(f"Falha na configuração: {output}")
            
            logger.info(f"Threshold {self.parameter} configurado com sucesso")
            
            return {
                "status": "success",
                "message": f"Threshold {self.parameter} {self.limit_type} configurado com sucesso",
                "interface": interface,
                "parameter": self.parameter,
                "limit_type": self.limit_type,
                "value": self.value,
                "unit": self._get_parameter_unit()
            }
            
        except Exception as e:
            error_msg = f"Falha ao configurar threshold óptico: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "message": error_msg,
                "interface": f"{self.frame}/{self.slot}/{self.port}",
                "parameter": self.parameter
            }
    
    def _validate_threshold_value(self):
        """Valida se o valor do threshold está dentro dos limites aceitáveis."""
        validation_ranges = {
            "rx-power": (-50.0, 10.0),  # dBm
            "tx-power": (-10.0, 10.0),  # dBm  
            "bias": (0.0, 100.0),       # mA
            "temperature": (-40.0, 85.0), # °C
            "voltage": (2.5, 5.5)       # V
        }
        
        if self.parameter in validation_ranges:
            min_val, max_val = validation_ranges[self.parameter]
            if not (min_val <= self.value <= max_val):
                raise ValueError(f"Valor {self.value} fora do range válido para {self.parameter}: {min_val} a {max_val}")
    
    def _get_parameter_unit(self) -> str:
        """Retorna a unidade do parâmetro."""
        units = {
            "rx-power": "dBm",
            "tx-power": "dBm",
            "bias": "mA",
            "temperature": "°C", 
            "voltage": "V"
        }
        return units.get(self.parameter, "")


class RemoveOpticalThresholdCommand(BaseCommand):
    """
    Remove todos os thresholds de alarme do módulo óptico.
    """
    
    def __init__(self, frame: int, slot: int, port: int):
        """
        Inicializa comando para remover thresholds.
        
        Args:
            frame: Frame da interface
            slot: Slot da interface  
            port: Porta da interface
        """
        self.frame = frame
        self.slot = slot
        self.port = port
        
    def execute(self, connection_manager, olt_version: str = None) -> Dict[str, Any]:
        """
        Executa remoção de thresholds ópticos.
        
        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT (opcional)
            
        Returns:
            Resultado da operação
        """
        try:
            interface = f"{self.frame}/{self.slot}/{self.port}"
            logger.info(f"Removendo thresholds ópticos para interface {interface}")
            
            # Comandos para remover thresholds
            commands = [
                "config",
                f"interface gpon {self.frame}/{self.slot}",
                "undo optical-module threshold",
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
                    raise Exception(f"Falha na remoção: {output}")
            
            logger.info(f"Thresholds ópticos removidos com sucesso")
            
            return {
                "status": "success",
                "message": f"Thresholds ópticos removidos com sucesso para interface {interface}",
                "interface": interface
            }
            
        except Exception as e:
            error_msg = f"Falha ao remover thresholds ópticos: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "message": error_msg,
                "interface": f"{self.frame}/{self.slot}/{self.port}"
            }