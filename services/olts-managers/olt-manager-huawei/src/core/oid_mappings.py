# -*- coding: utf-8 -*-
"""
Mapeamentos de OIDs SNMP para diferentes modelos e versões de firmware da Huawei.
Centraliza todos os OIDs para facilitar manutenção e suporte a múltiplos modelos.
"""

from typing import Dict, Optional
from dataclasses import dataclass
from ..core.logging import get_logger

logger = get_logger(__name__)

@dataclass
class OIDMapping:
    """Mapeamento de OID com metadados."""
    oid_base: str
    description: str
    scaling_factor: float = 1.0
    unit: str = ""
    valid_range: Optional[tuple] = None

class HuaweiOIDManager:
    """Gerenciador de OIDs para equipamentos Huawei."""
    
    def __init__(self):
        self._oid_mappings = self._initialize_oid_mappings()
    
    def _initialize_oid_mappings(self) -> Dict[str, Dict[str, Dict[str, OIDMapping]]]:
        """Inicializa mapeamentos de OIDs por modelo e categoria."""
        return {
            # MA5600T Series
            "MA5600T": {
                "ont_optical": {
                    "rx_power": OIDMapping(
                        oid_base="1.3.6.1.4.1.2011.6.128.1.1.2.51.1.4",
                        description="ONT RX Power",
                        scaling_factor=100.0,
                        unit="dBm",
                        valid_range=(-50.0, 10.0)
                    ),
                    "tx_power": OIDMapping(
                        oid_base="1.3.6.1.4.1.2011.6.128.1.1.2.51.1.3",
                        description="ONT TX Power",
                        scaling_factor=100.0,
                        unit="dBm",
                        valid_range=(-10.0, 10.0)
                    ),
                    "temperature": OIDMapping(
                        oid_base="1.3.6.1.4.1.2011.6.128.1.1.2.51.1.7",
                        description="ONT Temperature",
                        scaling_factor=1.0,
                        unit="°C",
                        valid_range=(-40.0, 85.0)
                    ),
                    "voltage": OIDMapping(
                        oid_base="1.3.6.1.4.1.2011.6.128.1.1.2.51.1.6",
                        description="ONT Supply Voltage",
                        scaling_factor=100.0,
                        unit="V",
                        valid_range=(2.5, 5.5)
                    )
                },
                "ont_info": {
                    "serial_number": OIDMapping(
                        oid_base="1.3.6.1.4.1.2011.6.128.1.1.2.43.1.1",
                        description="ONT Serial Number"
                    ),
                    "run_state": OIDMapping(
                        oid_base="1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9",
                        description="ONT Running State"
                    ),
                    "config_state": OIDMapping(
                        oid_base="1.3.6.1.4.1.2011.6.128.1.1.2.43.1.10", 
                        description="ONT Configuration State"
                    ),
                    "distance": OIDMapping(
                        oid_base="1.3.6.1.4.1.2011.6.128.1.1.2.46.1.20",
                        description="ONT Distance",
                        unit="m"
                    )
                },
                "port_info": {
                    "admin_state": OIDMapping(
                        oid_base="1.3.6.1.4.1.2011.6.128.1.1.2.21.1.10",
                        description="Port Admin State"
                    ),
                    "oper_state": OIDMapping(
                        oid_base="1.3.6.1.4.1.2011.6.128.1.1.2.21.1.5",
                        description="Port Operational State"
                    )
                },
                "traffic_stats": {
                    "in_octets": OIDMapping(
                        oid_base="1.3.6.1.2.1.2.2.1.10",
                        description="Input Octets"
                    ),
                    "out_octets": OIDMapping(
                        oid_base="1.3.6.1.2.1.2.2.1.16",
                        description="Output Octets"
                    ),
                    "in_packets": OIDMapping(
                        oid_base="1.3.6.1.2.1.2.2.1.11",
                        description="Input Packets"
                    ),
                    "out_packets": OIDMapping(
                        oid_base="1.3.6.1.2.1.2.2.1.17",
                        description="Output Packets"
                    )
                }
            },
            
            # MA5800 Series (pode ter OIDs diferentes)
            "MA5800": {
                "ont_optical": {
                    "rx_power": OIDMapping(
                        oid_base="1.3.6.1.4.1.2011.6.128.1.1.2.51.1.4",
                        description="ONT RX Power",
                        scaling_factor=100.0,
                        unit="dBm",
                        valid_range=(-50.0, 10.0)
                    ),
                    "tx_power": OIDMapping(
                        oid_base="1.3.6.1.4.1.2011.6.128.1.1.2.51.1.3",
                        description="ONT TX Power", 
                        scaling_factor=100.0,
                        unit="dBm",
                        valid_range=(-10.0, 10.0)
                    ),
                    "temperature": OIDMapping(
                        oid_base="1.3.6.1.4.1.2011.6.128.1.1.2.51.1.7",
                        description="ONT Temperature",
                        scaling_factor=1.0,
                        unit="°C",
                        valid_range=(-40.0, 85.0)
                    )
                },
                # ... outros mapeamentos similares ao MA5600T
            }
        }
    
    def get_oid(self, model: str, category: str, metric: str, index: str = "") -> Optional[str]:
        """
        Obtém OID completo baseado no modelo, categoria e métrica.
        
        Args:
            model: Modelo da OLT (ex: "MA5600T")
            category: Categoria (ex: "ont_optical")
            metric: Métrica (ex: "rx_power")
            index: Índice SNMP (será anexado ao final)
            
        Returns:
            OID completo ou None se não encontrado
        """
        try:
            # Normaliza o modelo para busca
            normalized_model = self._normalize_model(model)
            
            if normalized_model not in self._oid_mappings:
                logger.warning(f"Modelo não suportado: {model} (normalizado: {normalized_model})")
                return None
            
            if category not in self._oid_mappings[normalized_model]:
                logger.warning(f"Categoria não encontrada: {category} para modelo {normalized_model}")
                return None
            
            if metric not in self._oid_mappings[normalized_model][category]:
                logger.warning(f"Métrica não encontrada: {metric} em {category} para modelo {normalized_model}")
                return None
            
            mapping = self._oid_mappings[normalized_model][category][metric]
            oid_base = mapping.oid_base
            
            # Adiciona índice se fornecido
            if index:
                return f"{oid_base}.{index}"
            else:
                return oid_base
                
        except Exception as e:
            logger.error(f"Erro ao obter OID: {e}")
            return None
    
    def get_oid_mapping(self, model: str, category: str, metric: str) -> Optional[OIDMapping]:
        """
        Obtém mapeamento completo de OID com metadados.
        
        Returns:
            OIDMapping ou None se não encontrado
        """
        try:
            normalized_model = self._normalize_model(model)
            
            if (normalized_model in self._oid_mappings and
                category in self._oid_mappings[normalized_model] and
                metric in self._oid_mappings[normalized_model][category]):
                
                return self._oid_mappings[normalized_model][category][metric]
            
            return None
            
        except Exception as e:
            logger.error(f"Erro ao obter mapeamento OID: {e}")
            return None
    
    def _normalize_model(self, model: str) -> str:
        """
        Normaliza nome do modelo para busca consistente.
        
        Args:
            model: Nome do modelo (pode vir de diferentes fontes)
            
        Returns:
            Nome normalizado do modelo
        """
        if not model:
            return "MA5600T"  # Default
        
        model_upper = model.upper()
        
        # Mapeia variações para nomes padronizados
        if any(variant in model_upper for variant in ["MA5603", "MA5608", "MA5680", "MA5683"]):
            return "MA5600T"
        elif any(variant in model_upper for variant in ["MA5800", "MA58"]):
            return "MA5800"
        elif "MA56" in model_upper:
            return "MA5600T"
        else:
            logger.info(f"Modelo desconhecido: {model}, usando MA5600T como padrão")
            return "MA5600T"
    
    def get_supported_models(self) -> list:
        """Retorna lista de modelos suportados."""
        return list(self._oid_mappings.keys())
    
    def get_categories(self, model: str) -> list:
        """Retorna categorias disponíveis para um modelo."""
        normalized_model = self._normalize_model(model)
        if normalized_model in self._oid_mappings:
            return list(self._oid_mappings[normalized_model].keys())
        return []
    
    def get_metrics(self, model: str, category: str) -> list:
        """Retorna métricas disponíveis para um modelo e categoria."""
        normalized_model = self._normalize_model(model)
        if (normalized_model in self._oid_mappings and 
            category in self._oid_mappings[normalized_model]):
            return list(self._oid_mappings[normalized_model][category].keys())
        return []

# Instância global
oid_manager = HuaweiOIDManager()