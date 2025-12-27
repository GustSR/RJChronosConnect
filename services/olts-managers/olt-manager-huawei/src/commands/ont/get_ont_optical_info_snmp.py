import asyncio
from pysnmp.hlapi import v3arch
from ..base_command import OLTCommand
from typing import Dict, Any
from ...core.parsers import snmp_converter
from ...core.oid_mappings import oid_manager
from ...core.logging import get_logger

logger = get_logger(__name__)

class GetOntOpticalInfoSnmpCommand(OLTCommand):
    """Command to get ONT optical info via SNMP."""

    def __init__(self, host: str, community_string: str, port: str, ont_id: int):
        self.host = host
        self.community = community_string
        self.port_str = port
        self.ont_id = ont_id

    def execute(self, connection_manager=None, olt_version: str = None) -> Dict[str, Any]:
        """
        Executes the SNMP GET command.
        Note: connection_manager and olt_version are not used for SNMP commands.
        """
        async def _execute_async() -> Dict[str, Any]:
            # Detecta modelo da OLT baseado no host ou usa padrão
            olt_model = self._detect_olt_model()
            
            # Calcula índice baseado na porta e ONT ID
            ont_index = self._calculate_ont_index(self.port_str, self.ont_id)
            
            # Obtém OIDs do gerenciador centralizado
            oids = {}
            for metric in ['rx_power', 'tx_power', 'temperature', 'voltage']:
                oid = oid_manager.get_oid(olt_model, 'ont_optical', metric, ont_index)
                if oid:
                    oids[metric] = oid
                else:
                    logger.warning(f"OID não encontrado para {metric} no modelo {olt_model}")
            
            logger.debug(f"Consultando informações ópticas para ONT {self.ont_id} na porta {self.port_str}")

            snmp_engine = v3arch.SnmpEngine()
            auth = v3arch.CommunityData(self.community, mpModel=0) # mpModel=0 for SNMPv1
            transport = await v3arch.UdpTransportTarget.create((self.host, 161))
            context = v3arch.ContextData()

            results = {}
            for key, oid in oids.items():
                error_indication, error_status, error_index, var_binds = await v3arch.get_cmd(
                    snmp_engine,
                    auth,
                    transport,
                    context,
                    v3arch.ObjectType(v3arch.ObjectIdentity(oid))
                )

                if error_indication:
                    logger.error(f"Erro SNMP para {key}: {error_indication}")
                    results[key] = None
                elif error_status:
                    error_status_text = error_status.prettyPrint() if hasattr(error_status, "prettyPrint") else str(error_status)
                    logger.error(f"Erro SNMP para {key}: {error_status_text} at {error_index and var_binds[int(error_index) - 1][0] or '??'}")
                    results[key] = None
                else:
                    # Usa conversores robustos com metadados do OID
                    raw_val = var_binds[0][1]
                    mapping = oid_manager.get_oid_mapping(olt_model, 'ont_optical', key)
                    
                    if key in ['rx_power', 'tx_power']:
                        scaling = mapping.scaling_factor if mapping else 100.0
                        results[key] = snmp_converter.convert_optical_power(raw_val, scaling_factor=scaling)
                    elif key == 'temperature':
                        scaling = mapping.scaling_factor if mapping else 1.0
                        results[key] = snmp_converter.convert_temperature(raw_val, scaling_factor=scaling)
                    elif key == 'voltage':
                        scaling = mapping.scaling_factor if mapping else 100.0
                        try:
                            results[key] = round(float(raw_val) / scaling, 2)
                        except (ValueError, TypeError):
                            results[key] = None
                    else:
                        # Valor genérico
                        try:
                            results[key] = float(raw_val)
                        except (ValueError, TypeError):
                            results[key] = str(raw_val)
                    
                    logger.debug(f"Valor SNMP convertido para {key}: {results[key]} {mapping.unit if mapping else ''}")

            return results

        return asyncio.run(_execute_async())

    def _detect_olt_model(self) -> str:
        """
        Detecta o modelo da OLT baseado no host ou outras informações.
        
        Returns:
            Modelo detectado da OLT
        """
        # Por enquanto retorna padrão, mas pode ser expandido para:
        # - Consultar SNMP sysDescr
        # - Usar mapeamento de IPs para modelos
        # - Buscar em banco de dados de configuração
        return "MA5600T"
    
    def _calculate_ont_index(self, port_str: str, ont_id: int) -> str:
        """
        Calcula o índice SNMP baseado na porta e ONT ID.
        
        Args:
            port_str: String da porta (frame/slot/port)
            ont_id: ID da ONT
            
        Returns:
            Índice calculado para uso em OIDs
        """
        try:
            # Parse da string da porta
            parts = port_str.split('/')
            if len(parts) != 3:
                logger.warning(f"Formato de porta inválido: {port_str}")
                return str(ont_id)  # Fallback simples
            
            frame, slot, port = map(int, parts)
            
            # Fórmula baseada na documentação Huawei
            # Precisa ser validada com equipamentos reais
            calculated_index = (frame * 1000000) + (slot * 10000) + (port * 100) + ont_id
            
            logger.debug(f"Calculado índice SNMP: {calculated_index} para {port_str}/{ont_id}")
            return str(calculated_index)
            
        except (ValueError, IndexError) as e:
            logger.error(f"Erro ao calcular índice SNMP: {e}")
            return str(ont_id)  # Fallback
    
    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        # Não usado para comandos SNMP pois o parsing acontece diretamente no execute.
        pass
