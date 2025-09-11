# -*- coding: utf-8 -*-
"""
Módulo de parsing robusto para comandos CLI da OLT Huawei.
Contém parsers flexíveis que se adaptam a diferentes versões de firmware.
"""

import re
from typing import Dict, List, Any, Optional, Callable, Union
from dataclasses import dataclass
from ..core.logging import get_logger

logger = get_logger(__name__)

@dataclass
class ParsingRule:
    """Define uma regra de parsing com fallbacks."""
    name: str
    pattern: str
    fields: List[str]
    firmware_versions: Optional[List[str]] = None  # Versões específicas onde funciona
    fallback_pattern: Optional[str] = None
    post_processor: Optional[Callable] = None

class RobustParser:
    """Parser robusto que tenta múltiplas estratégias de parsing."""
    
    def __init__(self):
        self.rules: Dict[str, List[ParsingRule]] = {}
        self._setup_default_rules()
    
    def _setup_default_rules(self):
        """Configura regras padrão de parsing para comandos comuns."""
        
        # Regras para 'display board'
        self.add_parsing_rules("display_board", [
            ParsingRule(
                name="standard_v800",
                pattern=r"^\s*(?P<board_id>\d+)\s+(?P<board_type>\S+)\s+(?P<status>\w+)\s*(?P<sub_type_b>\S*)\s*(?P<sub_type_c>\S*)\s*(?P<online>\S*)",
                fields=["board_id", "board_type", "status", "sub_type_b", "sub_type_c", "online"],
                firmware_versions=["V800R"],
                fallback_pattern=r"^\s*(\d+)\s+(\S+)\s+(\w+)"
            ),
            ParsingRule(
                name="compact_format",
                pattern=r"^\s*(?P<board_id>\d+)\s+(?P<board_type>\S+)\s+(?P<status>\w+)",
                fields=["board_id", "board_type", "status"],
                fallback_pattern=r"(\d+).*?(\S+).*?(\w+)"
            )
        ])
        
        # Regras para 'display ont info'
        self.add_parsing_rules("display_ont_info", [
            ParsingRule(
                name="detailed_v800",
                pattern=r"^\s*(?P<ont_id>\d+)\s+(?P<serial_number>\S+)\s+(?P<run_state>\w+)\s+(?P<config_state>\w+)\s+(?P<match_state>\w+)",
                fields=["ont_id", "serial_number", "run_state", "config_state", "match_state"],
                firmware_versions=["V800R"]
            ),
            ParsingRule(
                name="basic_format",
                pattern=r"^\s*(?P<ont_id>\d+)\s+(?P<serial_number>\S+)\s+(?P<status>\w+)",
                fields=["ont_id", "serial_number", "status"]
            )
        ])
        
        # Regras para 'display port state'
        self.add_parsing_rules("display_port_state", [
            ParsingRule(
                name="gpon_format",
                pattern=r"^\s*(?P<port_id>\d+/\d+/\d+)\s+(?P<admin_state>\w+)\s+(?P<oper_state>\w+)\s*(?P<auto_find>\w*)",
                fields=["port_id", "admin_state", "oper_state", "auto_find"]
            )
        ])
    
    def add_parsing_rules(self, command_name: str, rules: List[ParsingRule]):
        """Adiciona regras de parsing para um comando específico."""
        self.rules[command_name] = rules
    
    def parse_command_output(self, command_name: str, raw_output: str, 
                           firmware_version: str = None) -> List[Dict[str, Any]]:
        """
        Faz parsing robusto da saída de um comando.
        
        Args:
            command_name: Nome do comando (ex: 'display_board')
            raw_output: Saída bruta do comando
            firmware_version: Versão do firmware (opcional)
            
        Returns:
            Lista de dicionários com dados parseados
        """
        if command_name not in self.rules:
            logger.warning(f"Não há regras de parsing para o comando '{command_name}'")
            return []
        
        rules = self.rules[command_name]
        
        # Ordena regras: primeiro as específicas para a versão do firmware
        if firmware_version:
            rules = sorted(rules, key=lambda r: (
                0 if r.firmware_versions and any(v in firmware_version for v in r.firmware_versions) else 1
            ))
        
        for rule in rules:
            try:
                result = self._try_parse_with_rule(rule, raw_output)
                if result:
                    logger.debug(f"Parsing bem-sucedido com regra '{rule.name}' para comando '{command_name}'")
                    return result
            except Exception as e:
                logger.debug(f"Falha ao usar regra '{rule.name}': {e}")
                continue
        
        # Se todas as regras falharam, tenta parsing genérico
        logger.warning(f"Todas as regras falharam para comando '{command_name}', tentando parsing genérico")
        return self._generic_fallback_parse(raw_output)
    
    def _try_parse_with_rule(self, rule: ParsingRule, raw_output: str) -> List[Dict[str, Any]]:
        """Tenta fazer parsing com uma regra específica."""
        results = []
        
        # Primeiro tenta o padrão principal
        pattern = re.compile(rule.pattern, re.MULTILINE)
        matches = pattern.finditer(raw_output)
        
        for match in matches:
            data = match.groupdict()
            
            # Limpa valores vazios
            for key, value in data.items():
                if isinstance(value, str) and not value.strip():
                    data[key] = None
            
            # Aplica pós-processamento se definido
            if rule.post_processor:
                data = rule.post_processor(data)
            
            results.append(data)
        
        # Se não encontrou nada e tem fallback, tenta o padrão de fallback
        if not results and rule.fallback_pattern:
            fallback_pattern = re.compile(rule.fallback_pattern, re.MULTILINE)
            fallback_matches = fallback_pattern.finditer(raw_output)
            
            for match in fallback_matches:
                # Cria um dicionário usando os grupos numerados
                groups = match.groups()
                data = {}
                for i, field in enumerate(rule.fields[:len(groups)]):
                    data[field] = groups[i] if groups[i] and groups[i].strip() else None
                results.append(data)
        
        return results
    
    def _generic_fallback_parse(self, raw_output: str) -> List[Dict[str, Any]]:
        """Parsing genérico de última tentativa."""
        results = []
        
        # Tenta extrair linhas que parecem ser dados tabulares
        lines = raw_output.split('\n')
        for line in lines:
            line = line.strip()
            if not line or line.startswith('-') or 'command' in line.lower():
                continue
            
            # Se a linha tem múltiplas colunas separadas por espaços
            parts = line.split()
            if len(parts) >= 2:
                result = {"raw_data": line, "parsed": False}
                # Tenta identificar alguns padrões comuns
                if parts[0].isdigit():
                    result["id"] = int(parts[0])
                if len(parts) > 1:
                    result["value"] = " ".join(parts[1:])
                results.append(result)
        
        if results:
            logger.info(f"Parsing genérico retornou {len(results)} itens")
        
        return results

class SNMPValueConverter:
    """Conversor robusto para valores SNMP."""
    
    @staticmethod
    def convert_optical_power(raw_value: Any, scaling_factor: float = 100.0) -> Optional[float]:
        """
        Converte potência óptica SNMP para dBm.
        
        Args:
            raw_value: Valor bruto do SNMP
            scaling_factor: Fator de escala (padrão: 100)
            
        Returns:
            Valor em dBm ou None se inválido
        """
        try:
            if raw_value is None:
                return None
            
            # Converte para float
            value = float(raw_value)
            
            # Aplica fator de escala
            converted = value / scaling_factor
            
            # Validação básica para potência óptica (-50 a +10 dBm é um range razoável)
            if -50 <= converted <= 10:
                return round(converted, 2)
            else:
                logger.warning(f"Valor de potência óptica fora do range esperado: {converted} dBm")
                return converted
                
        except (ValueError, TypeError) as e:
            logger.error(f"Erro ao converter potência óptica: {e}")
            return None
    
    @staticmethod
    def convert_temperature(raw_value: Any, scaling_factor: float = 1.0, offset: float = 0) -> Optional[float]:
        """
        Converte temperatura SNMP.
        
        Args:
            raw_value: Valor bruto do SNMP
            scaling_factor: Fator de escala
            offset: Offset a ser aplicado
            
        Returns:
            Temperatura em Celsius ou None se inválido
        """
        try:
            if raw_value is None:
                return None
            
            value = float(raw_value)
            converted = (value / scaling_factor) + offset
            
            # Validação básica para temperatura (-40 a +85°C é range típico)
            if -40 <= converted <= 85:
                return round(converted, 1)
            else:
                logger.warning(f"Temperatura fora do range esperado: {converted}°C")
                return converted
                
        except (ValueError, TypeError) as e:
            logger.error(f"Erro ao converter temperatura: {e}")
            return None
    
    @staticmethod
    def convert_ifindex_to_port(if_index: int, olt_model: str = "MA5600T") -> Optional[str]:
        """
        Converte ifIndex para string de porta baseado no modelo da OLT.
        
        Args:
            if_index: ifIndex SNMP
            olt_model: Modelo da OLT
            
        Returns:
            String da porta (frame/slot/port) ou None se inválido
        """
        try:
            if if_index is None:
                return None
            
            # Fórmulas específicas por modelo
            if olt_model.startswith("MA56"):
                # Fórmula para MA5600T series
                base_index = 4194304000
                slot_multiplier = 8192
                port_multiplier = 256
                
                if if_index < base_index:
                    return f"unknown_ifindex_{if_index}"
                
                temp = if_index - base_index
                slot = temp // slot_multiplier
                temp %= slot_multiplier
                port = temp // port_multiplier
                
                return f"0/{slot}/{port}"
                
            elif olt_model.startswith("MA58"):
                # Fórmula para MA5800 series (pode ser diferente)
                # Esta é uma estimativa - precisa ser validada
                base_index = 8388608000
                slot_multiplier = 16384
                port_multiplier = 512
                
                if if_index < base_index:
                    return f"unknown_ifindex_{if_index}"
                
                temp = if_index - base_index
                slot = temp // slot_multiplier
                temp %= slot_multiplier
                port = temp // port_multiplier
                
                return f"0/{slot}/{port}"
            
            else:
                # Modelo desconhecido - usa fórmula genérica
                logger.warning(f"Modelo de OLT desconhecido: {olt_model}, usando fórmula genérica")
                return f"unknown_model_{if_index}"
                
        except (ValueError, TypeError) as e:
            logger.error(f"Erro ao converter ifIndex {if_index}: {e}")
            return f"error_{if_index}"

# Instâncias globais
robust_parser = RobustParser()
snmp_converter = SNMPValueConverter()