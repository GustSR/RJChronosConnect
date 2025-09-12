# -*- coding: utf-8 -*-
"""
Configuração centralizada de OIDs para traps SNMP da Huawei.
Facilita manutenção e suporte a diferentes modelos/versões.
"""

from typing import Dict, Any
from dataclasses import dataclass

@dataclass
class TrapOIDConfig:
    """Configuração de OIDs para traps SNMP."""
    
    # OID padrão para identificar o tipo de trap no varbind
    SNMP_TRAP_OID_VARBIND = '1.3.6.1.6.3.1.1.4.1.0'
    
    # Traps e Varbinds de Mudança de Estado
    TRAP_OID_ONT_STATE_CHANGE = '1.3.6.1.4.1.2011.6.128.1.1.2.0.6'
    VARBIND_OID_IF_INDEX = '1.3.6.1.2.1.2.2.1.1'  # ifIndex
    VARBIND_OID_ONT_RUN_STATUS = '1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9'  # hwGponDeviceOntOnlineState
    VARBIND_OID_ONT_SERIAL = '1.3.6.1.4.1.2011.6.128.1.1.2.43.1.1'  # hwGponOntSerialNum
    
    # Traps e Varbinds de Alarme Óptico
    TRAP_OID_ONT_ALARM = '1.3.6.1.4.1.2011.6.128.1.1.2.0.5'  # hwGponDeviceOntAlarmTrap
    VARBIND_OID_ALARM_ID = '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.1.1'  # hwOntAlarmProfileId
    VARBIND_OID_ALARM_VALUE = '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.1.2'  # hwOntAlarmProfileValue
    VARBIND_OID_ALARM_STATUS = '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.1.3'  # hwOntAlarmProfileStatus (1: active, 2: cleared)

class TrapOIDManager:
    """Gerenciador de OIDs para traps, com suporte a diferentes modelos."""
    
    def __init__(self):
        # Configurações por modelo de OLT
        self._model_configs = {
            "MA5600T": TrapOIDConfig(),
            "MA5800": TrapOIDConfig(),  # Por enquanto usa os mesmos OIDs
            "default": TrapOIDConfig()
        }
        
        # Mapeamentos de status para valores legíveis
        self.status_mappings = {
            'ont_run_status': {1: 'online', 2: 'offline'},
            'alarm_status': {1: 'active', 2: 'cleared'}
        }
    
    def get_config(self, model: str = "default") -> TrapOIDConfig:
        """
        Obtém configuração de OIDs para um modelo específico.
        
        Args:
            model: Modelo da OLT (ex: "MA5600T")
            
        Returns:
            Configuração de OIDs para o modelo
        """
        normalized_model = self._normalize_model(model)
        return self._model_configs.get(normalized_model, self._model_configs["default"])
    
    def _normalize_model(self, model: str) -> str:
        """Normaliza nome do modelo."""
        if not model:
            return "default"
        
        model_upper = model.upper()
        
        if any(variant in model_upper for variant in ["MA5603", "MA5608", "MA5680", "MA5683"]):
            return "MA5600T"
        elif any(variant in model_upper for variant in ["MA5800", "MA58"]):
            return "MA5800"
        elif "MA56" in model_upper:
            return "MA5600T"
        else:
            return "default"
    
    def get_status_text(self, status_type: str, value: int) -> str:
        """
        Converte valor numérico de status para texto legível.
        
        Args:
            status_type: Tipo de status ('ont_run_status', 'alarm_status')
            value: Valor numérico
            
        Returns:
            Texto legível do status
        """
        if status_type in self.status_mappings:
            return self.status_mappings[status_type].get(value, 'unknown')
        return str(value)
    
    def get_supported_models(self) -> list:
        """Retorna lista de modelos suportados."""
        return [model for model in self._model_configs.keys() if model != "default"]
    
    def add_model_config(self, model: str, config: TrapOIDConfig):
        """
        Adiciona configuração personalizada para um modelo.
        
        Args:
            model: Nome do modelo
            config: Configuração de OIDs
        """
        self._model_configs[model] = config

# Instância global
trap_oid_manager = TrapOIDManager()