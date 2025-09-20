# -*- coding: utf-8 -*-
"""
Este módulo contém a implementação do receptor de Traps SNMP.

Ele é responsável por escutar notificações assíncronas enviadas pela OLT,
processá-las e, futuramente, encaminhá-las para outros serviços através de
uma fila de mensagens (como RabbitMQ).
"""

import threading
import requests
from typing import Optional, Dict, Any, List
from pysnmp.entity import engine, config
from pysnmp.carrier.asyncore.dgram import udp
from pysnmp.entity.rfc3413 import ntfrcv
from pysnmp.proto.rfc1902 import ObjectName

from ..rabbitmq_publisher import RabbitMQPublisher
from ..core.config import settings
from ..core.logging import get_logger
from ..core.parsers import snmp_converter
from ..core.trap_oids import trap_oid_manager

logger = get_logger(__name__)

# Configurações de OIDs são gerenciadas centralmente em trap_oids.py


class TrapListener:
    """Encapsula a lógica para receber e processar traps SNMP."""

    def __init__(self):
        """
        Inicializa o listener de traps, buscando a configuração de variáveis de ambiente.
        """
        self.host = settings.trap_listener_host
        self.port = settings.trap_listener_port
        self.community = settings.snmp_community
        
        self.snmp_engine = engine.SnmpEngine()
        self._thread = None
        self.rabbitmq_publisher = RabbitMQPublisher()

    def _configurar_transporte(self):
        """Configura o transporte UDP para o motor SNMP."""
        try:
            config.addTransport(
                self.snmp_engine,
                udp.domainName + (1,),
                udp.UdpTransport().openServerMode((self.host, self.port))
            )
            logger.info(f"Escutando traps SNMP em {self.host}:{self.port}")
        except Exception as e:
            logger.critical(f"Falha ao abrir a porta UDP {self.port} para traps: {e}")
            raise

    def _configurar_comunidade(self):
        """Configura a comunidade SNMP para autenticação de traps v2c."""
        config.addV1System(self.snmp_engine, 'default-area', self.community)

    def _processar_trap(self, snmp_engine, state_reference, context_engine_id, context_name, var_binds, cb_ctx):
        """
        Função de callback que é executada quando um trap é recebido.
        Decodifica o trap e o publica na fila de mensagens.
        """
        transport_domain, transport_address = snmp_engine.msgAndPduDsp.getTransportInfo(state_reference)
        remetente = transport_address[0]
        
        # Detecta modelo da OLT para usar OIDs corretos
        olt_model = self._detect_olt_model_from_ip(remetente)
        oid_config = trap_oid_manager.get_config(olt_model)
        
        var_binds_dict = {oid.prettyPrint(): val for oid, val in var_binds}
        trap_oid = var_binds_dict.get(oid_config.SNMP_TRAP_OID_VARBIND)

        if not trap_oid:
            logger.warning(f"Trap inesperado de {remetente}. Não foi possível determinar o OID do trap.")
            return

        trap_oid_str = str(trap_oid)
        logger.info(f"Trap recebido de {remetente} (OID: {trap_oid_str})")

        if trap_oid_str == oid_config.TRAP_OID_ONT_STATE_CHANGE:
            self._decodificar_mudanca_estado_ont(var_binds_dict, remetente, oid_config)
        elif trap_oid_str == oid_config.TRAP_OID_ONT_ALARM:
            self._decodificar_alarme_ont(var_binds_dict, remetente, oid_config)
        elif trap_oid_str == oid_config.TRAP_OID_DYING_GASP:
            self._decodificar_dying_gasp(var_binds_dict, remetente, oid_config)
        elif trap_oid_str == oid_config.TRAP_OID_PORT_DOWN:
            self._decodificar_port_down(var_binds_dict, remetente, oid_config)
        elif trap_oid_str == oid_config.TRAP_OID_PORT_UP:
            self._decodificar_port_up(var_binds_dict, remetente, oid_config)
        elif trap_oid_str == oid_config.TRAP_OID_LOS_ALARM:
            self._decodificar_los_alarm(var_binds_dict, remetente, oid_config)
        elif trap_oid_str == oid_config.TRAP_OID_LOF_ALARM:
            self._decodificar_lof_alarm(var_binds_dict, remetente, oid_config)
        else:
            logger.info(f"Trap não reconhecido ({trap_oid_str}) de {remetente}. Não será publicado.")

    def _get_olt_info_from_backend(self, olt_ip: str) -> Optional[Dict[str, Any]]:
        """
        Consulta o backend-api para obter informações completas da OLT pelo IP.

        Args:
            olt_ip: IP da OLT para buscar

        Returns:
            Dict com informações da OLT (id, name, etc.) ou None se não encontrada
        """
        try:
            backend_url = getattr(settings, 'backend_api_url', 'http://backend-api:8000')
            response = requests.get(
                f"{backend_url}/api/olts",
                params={"ip": olt_ip},
                timeout=5
            )

            if response.status_code == 200:
                olts_data = response.json()
                if olts_data and len(olts_data) > 0:
                    olt_info = olts_data[0]  # Pega a primeira OLT encontrada
                    logger.debug(f"OLT encontrada no backend: {olt_info}")
                    return olt_info
                else:
                    logger.warning(f"Nenhuma OLT encontrada no backend com IP {olt_ip}")
                    return None
            else:
                logger.warning(f"Backend retornou status {response.status_code} para IP {olt_ip}")
                return None

        except requests.RequestException as e:
            logger.error(f"Erro ao consultar backend para IP {olt_ip}: {e}")
            return None
        except Exception as e:
            logger.error(f"Erro inesperado ao consultar backend: {e}")
            return None

    def _enrich_message_with_olt_info(self, message: Dict[str, Any], olt_ip: str) -> Dict[str, Any]:
        """
        Enriquece a mensagem com informações da OLT obtidas do backend.

        Args:
            message: Mensagem original do trap
            olt_ip: IP da OLT

        Returns:
            Mensagem enriquecida com olt_id e olt_name
        """
        olt_info = self._get_olt_info_from_backend(olt_ip)

        if olt_info:
            # Adiciona informações enriquecidas da OLT
            message['olt_id'] = olt_info.get('id')
            message['olt_name'] = olt_info.get('name', f'OLT_{olt_ip}')
            logger.debug(f"Mensagem enriquecida com olt_id={message['olt_id']}, olt_name={message['olt_name']}")
        else:
            # Fallback: usar informações básicas
            message['olt_id'] = None
            message['olt_name'] = f'OLT_{olt_ip}'
            logger.warning(f"Usando informações de fallback para OLT {olt_ip}")

        return message

    def _publish_enriched_message(self, message: Dict[str, Any], olt_ip: str, event_type: str) -> None:
        """
        Enriquece e publica uma mensagem no RabbitMQ com dual routing para transição suave.

        Durante mudanças de nome, publica na routing key antiga e nova para evitar
        perda de mensagens em sistemas consumidores.

        Args:
            message: Mensagem original do trap
            olt_ip: IP da OLT
            event_type: Tipo do evento para routing key
        """
        # Enriquecer mensagem com informações da OLT do backend
        mensagem_enriquecida = self._enrich_message_with_olt_info(message, olt_ip)

        logger.debug(f"Dados decodificados do trap {event_type}: {mensagem_enriquecida}")

        # Determinar routing keys para dual routing
        routing_keys = self._determine_routing_keys(mensagem_enriquecida, olt_ip, event_type)

        # Publicar mensagem em todas as routing keys determinadas
        for routing_key in routing_keys:
            try:
                self.rabbitmq_publisher.publicar_mensagem(
                    exchange_name='olt_events',
                    routing_key=routing_key,
                    mensagem=mensagem_enriquecida
                )
                logger.debug(f"Mensagem publicada em routing key: {routing_key}")
            except Exception as e:
                logger.error(f"Erro ao publicar mensagem em routing key {routing_key}: {e}")

    def _determine_routing_keys(self, message: Dict[str, Any], olt_ip: str, event_type: str) -> List[str]:
        """
        Determina as routing keys para publicação, incluindo dual routing se necessário.

        Args:
            message: Mensagem enriquecida
            olt_ip: IP da OLT
            event_type: Tipo do evento

        Returns:
            Lista de routing keys para publicar a mensagem
        """
        routing_keys = []

        # 1. Routing key principal usando nome atual da OLT
        olt_name = message.get('olt_name')
        if olt_name and olt_name != f'OLT_{olt_ip}':
            # Usar nome da OLT como identificador principal
            olt_identifier = olt_name.replace('_', '-').lower()
            routing_keys.append(f"olt.{olt_identifier}.{event_type}")
        else:
            # Fallback para IP se nome não disponível
            routing_keys.append(f"olt.{olt_ip}.{event_type}")

        # 2. Verificar se há necessidade de dual routing (transição)
        dual_routing_keys = self._check_dual_routing_needed(message, olt_ip, event_type)
        routing_keys.extend(dual_routing_keys)

        # 3. Sempre manter routing key por IP como fallback
        ip_routing_key = f"olt.{olt_ip}.{event_type}"
        if ip_routing_key not in routing_keys:
            routing_keys.append(ip_routing_key)

        return routing_keys

    def _check_dual_routing_needed(self, message: Dict[str, Any], olt_ip: str, event_type: str) -> List[str]:
        """
        Verifica se é necessário dual routing devido a mudanças recentes de nome.

        Durante um período após mudança de nome, mantém routing keys antigas
        para garantir que consumidores não percam mensagens.

        Args:
            message: Mensagem enriquecida
            olt_ip: IP da OLT
            event_type: Tipo do evento

        Returns:
            Lista de routing keys adicionais para dual routing
        """
        additional_keys = []

        try:
            olt_id = message.get('olt_id')
            if not olt_id:
                return additional_keys

            # Verificar se houve mudança recente de nome via backend-api
            response = requests.get(
                f"{settings.backend_api_url}/olts/{olt_id}/sysname-history",
                timeout=3
            )

            if response.status_code == 200:
                history_data = response.json()

                # Verificar mudanças nas últimas 24 horas (período de transição)
                from datetime import datetime, timedelta
                transition_period = timedelta(hours=24)

                for record in history_data.get('recent_changes', []):
                    change_time = datetime.fromisoformat(record.get('timestamp'))
                    if datetime.now() - change_time <= transition_period:
                        # Adicionar routing key do nome anterior
                        old_name = record.get('old_sysname')
                        if old_name and old_name != message.get('olt_name'):
                            old_identifier = old_name.replace('_', '-').lower()
                            old_routing_key = f"olt.{old_identifier}.{event_type}"
                            if old_routing_key not in additional_keys:
                                additional_keys.append(old_routing_key)
                                logger.info(f"Dual routing ativo: {old_routing_key}")

        except requests.RequestException as e:
            logger.debug(f"Não foi possível verificar histórico de mudanças para dual routing: {e}")
        except Exception as e:
            logger.warning(f"Erro ao verificar dual routing: {e}")

        return additional_keys

    def _decodificar_mudanca_estado_ont(self, var_binds_dict: dict, olt_ip: str, oid_config):
        """Decodifica os dados do trap de mudança de estado da ONT e publica no RabbitMQ."""
        logger.info("Evento de mudança de estado da ONT recebido.")
        
        if_index_raw = var_binds_dict.get(oid_config.VARBIND_OID_IF_INDEX)
        status_raw = var_binds_dict.get(oid_config.VARBIND_OID_ONT_RUN_STATUS)
        serial_raw = var_binds_dict.get(oid_config.VARBIND_OID_ONT_SERIAL)

        if_index = int(if_index_raw) if if_index_raw else None
        # Detecta modelo da OLT baseado no IP (pode ser expandido)
        olt_model = self._detect_olt_model_from_ip(olt_ip)
        port_str = self._ifindex_to_port(if_index, olt_model) if if_index else None

        mensagem = {
            'event_type': 'ont.state.change',
            'olt_ip': olt_ip,
            'port': port_str,
            'if_index': if_index,
            'serial_number': serial_raw.prettyPrint() if serial_raw else None,
            'status': trap_oid_manager.get_status_text('ont_run_status', int(status_raw)) if status_raw else 'unknown'
        }

        self._publish_enriched_message(mensagem, olt_ip, 'ont.state_change')

    def _decodificar_alarme_ont(self, var_binds_dict: dict, olt_ip: str, oid_config):
        """Decodifica os dados do trap de alarme da ONT e publica no RabbitMQ."""
        logger.info("Evento de alarme de ONT recebido.")
        
        if_index_raw = var_binds_dict.get(oid_config.VARBIND_OID_IF_INDEX)
        alarm_id_raw = var_binds_dict.get(oid_config.VARBIND_OID_ALARM_ID)
        alarm_value_raw = var_binds_dict.get(oid_config.VARBIND_OID_ALARM_VALUE)
        alarm_status_raw = var_binds_dict.get(oid_config.VARBIND_OID_ALARM_STATUS)

        if_index = int(if_index_raw) if if_index_raw else None
        # Detecta modelo da OLT baseado no IP
        olt_model = self._detect_olt_model_from_ip(olt_ip)
        port_str = self._ifindex_to_port(if_index, olt_model) if if_index else None

        mensagem = {
            'event_type': 'ont.alarm',
            'olt_ip': olt_ip,
            'port': port_str,
            'if_index': if_index,
            'alarm_id': str(alarm_id_raw) if alarm_id_raw else None,
            'alarm_value': str(alarm_value_raw) if alarm_value_raw else None,
            'alarm_status': trap_oid_manager.get_status_text('alarm_status', int(alarm_status_raw)) if alarm_status_raw else 'unknown'
        }

        self._publish_enriched_message(mensagem, olt_ip, 'ont.alarm')

    def _decodificar_dying_gasp(self, var_binds_dict: dict, olt_ip: str, oid_config):
        """Decodifica trap de dying gasp (perda de energia da ONT)."""
        logger.critical("Evento DYING GASP recebido - ONT perdeu energia!")
        
        if_index_raw = var_binds_dict.get(oid_config.VARBIND_OID_IF_INDEX)
        ont_id_raw = var_binds_dict.get(oid_config.VARBIND_OID_ONT_ID)
        serial_raw = var_binds_dict.get(oid_config.VARBIND_OID_ONT_SERIAL)
        dying_gasp_time_raw = var_binds_dict.get(oid_config.VARBIND_OID_DYING_GASP_TIME)
        down_cause_raw = var_binds_dict.get(oid_config.VARBIND_OID_LAST_DOWN_CAUSE)

        if_index = int(if_index_raw) if if_index_raw else None
        olt_model = self._detect_olt_model_from_ip(olt_ip)
        port_str = self._ifindex_to_port(if_index, olt_model) if if_index else None

        mensagem = {
            'event_type': 'ont.power.dying_gasp',
            'severity': 'critical',
            'olt_ip': olt_ip,
            'port': port_str,
            'if_index': if_index,
            'ont_id': int(ont_id_raw) if ont_id_raw else None,
            'serial_number': serial_raw.prettyPrint() if serial_raw else None,
            'dying_gasp_time': dying_gasp_time_raw.prettyPrint() if dying_gasp_time_raw else None,
            'down_cause': trap_oid_manager.get_status_text('last_down_cause', int(down_cause_raw)) if down_cause_raw else 'dying_gasp',
            'detection_method': 'dying_gasp_trap',
            'immediate_action_required': True
        }

        self._publish_enriched_message(mensagem, olt_ip, 'ont.dying_gasp')

    def _decodificar_port_down(self, var_binds_dict: dict, olt_ip: str, oid_config):
        """Decodifica trap de porta PON down (possível rompimento de fibra)."""
        logger.critical("Evento PORT DOWN recebido - Possível rompimento de fibra!")
        
        port_index_raw = var_binds_dict.get(oid_config.VARBIND_OID_PORT_INDEX)
        if_index_raw = var_binds_dict.get(oid_config.VARBIND_OID_IF_INDEX)
        optical_power_raw = var_binds_dict.get(oid_config.VARBIND_OID_OPTICAL_POWER)

        if_index = int(if_index_raw) if if_index_raw else None
        olt_model = self._detect_olt_model_from_ip(olt_ip)
        port_str = self._ifindex_to_port(if_index, olt_model) if if_index else None

        mensagem = {
            'event_type': 'pon.interface.down',
            'severity': 'critical',
            'olt_ip': olt_ip,
            'port': port_str,
            'if_index': if_index,
            'port_index': int(port_index_raw) if port_index_raw else None,
            'optical_power': str(optical_power_raw) if optical_power_raw else 'unknown',
            'suspected_cause': 'fiber_cut_or_equipment_failure',
            'mass_impact_expected': True
        }
        
        self._publish_enriched_message(mensagem, olt_ip, 'pon.port_down')

    def _decodificar_port_up(self, var_binds_dict: dict, olt_ip: str, oid_config):
        """Decodifica trap de porta PON up (recuperação de conectividade)."""
        logger.info("Evento PORT UP recebido - Porta PON recuperada!")
        
        port_index_raw = var_binds_dict.get(oid_config.VARBIND_OID_PORT_INDEX)
        if_index_raw = var_binds_dict.get(oid_config.VARBIND_OID_IF_INDEX)

        if_index = int(if_index_raw) if if_index_raw else None
        olt_model = self._detect_olt_model_from_ip(olt_ip)
        port_str = self._ifindex_to_port(if_index, olt_model) if if_index else None

        mensagem = {
            'event_type': 'pon.interface.up',
            'severity': 'info',
            'olt_ip': olt_ip,
            'port': port_str,
            'if_index': if_index,
            'port_index': int(port_index_raw) if port_index_raw else None,
            'recovery_detected': True
        }
        
        self._publish_enriched_message(mensagem, olt_ip, 'pon.port_up')

    def _decodificar_los_alarm(self, var_binds_dict: dict, olt_ip: str, oid_config):
        """Decodifica trap de alarme LOS (Loss of Signal)."""
        logger.warning("Alarme LOS recebido - Perda de sinal ótico!")
        
        if_index_raw = var_binds_dict.get(oid_config.VARBIND_OID_IF_INDEX)
        alarm_status_raw = var_binds_dict.get(oid_config.VARBIND_OID_ALARM_STATUS)

        if_index = int(if_index_raw) if if_index_raw else None
        olt_model = self._detect_olt_model_from_ip(olt_ip)
        port_str = self._ifindex_to_port(if_index, olt_model) if if_index else None

        mensagem = {
            'event_type': 'ont.signal.los_alarm',
            'severity': 'high',
            'olt_ip': olt_ip,
            'port': port_str,
            'if_index': if_index,
            'alarm_type': 'loss_of_signal',
            'alarm_status': trap_oid_manager.get_status_text('alarm_status', int(alarm_status_raw)) if alarm_status_raw else 'active',
            'possible_causes': ['fiber_disconnected', 'ont_powered_off', 'optical_degradation']
        }
        
        self._publish_enriched_message(mensagem, olt_ip, 'ont.los_alarm')

    def _decodificar_lof_alarm(self, var_binds_dict: dict, olt_ip: str, oid_config):
        """Decodifica trap de alarme LOF (Loss of Frame)."""
        logger.warning("Alarme LOF recebido - Perda de quadro!")
        
        if_index_raw = var_binds_dict.get(oid_config.VARBIND_OID_IF_INDEX)
        alarm_status_raw = var_binds_dict.get(oid_config.VARBIND_OID_ALARM_STATUS)

        if_index = int(if_index_raw) if if_index_raw else None
        olt_model = self._detect_olt_model_from_ip(olt_ip)
        port_str = self._ifindex_to_port(if_index, olt_model) if if_index else None

        mensagem = {
            'event_type': 'ont.signal.lof_alarm',
            'severity': 'high',
            'olt_ip': olt_ip,
            'port': port_str,
            'if_index': if_index,
            'alarm_type': 'loss_of_frame',
            'alarm_status': trap_oid_manager.get_status_text('alarm_status', int(alarm_status_raw)) if alarm_status_raw else 'active',
            'possible_causes': ['signal_degradation', 'synchronization_loss', 'equipment_malfunction']
        }
        
        self._publish_enriched_message(mensagem, olt_ip, 'ont.lof_alarm')

    def _ifindex_to_port(self, if_index: int, olt_model: str = "MA5600T") -> str:
        """Converte ifIndex para string de porta usando lógica robusta."""
        try:
            result = snmp_converter.convert_ifindex_to_port(if_index, olt_model)
            if result:
                logger.debug(f"Convertido ifIndex {if_index} para porta {result}")
                return result
            else:
                logger.warning(f"Falha na conversão de ifIndex {if_index}")
                return f"unknown_ifindex_{if_index}"
        except Exception as e:
            logger.error(f"Erro na conversão de ifIndex {if_index}: {e}")
            return f"error_ifindex_{if_index}"

    def iniciar(self):
        """Inicia o listener de traps e a conexão com o RabbitMQ."""
        logger.info("Iniciando o listener de traps SNMP...")
        self.rabbitmq_publisher.conectar()
        self.rabbitmq_publisher.declarar_exchange('olt_events', 'topic')
        
        self._configurar_transporte()
        self._configurar_comunidade()

        ntfrcv.NotificationReceiver(self.snmp_engine, self._processar_trap)

        self._thread = threading.Thread(target=self.snmp_engine.transportDispatcher.runDispatcher)
        self._thread.daemon = True
        self._thread.start()
        logger.info("Listener de traps SNMP iniciado e aguardando traps.")

    def parar(self):
        """Para o listener de traps e fecha as conexões."""
        if self._thread and self._thread.is_alive():
            logger.info("Parando o listener de traps SNMP...")
            self.snmp_engine.transportDispatcher.closeDispatcher()
            self._thread.join()
            logger.info("Listener de traps SNMP parado.")
        
        self.rabbitmq_publisher.fechar_conexao()
    
    def _detect_olt_model_from_ip(self, olt_ip: str) -> str:
        """
        Detecta o modelo da OLT baseado no IP.

        Args:
            olt_ip: IP da OLT

        Returns:
            Modelo detectado (usa configuração ou padrão)
        """
        # Busca no mapeamento configurado via variáveis de ambiente
        ip_to_model = settings.ip_to_model_dict

        model = ip_to_model.get(olt_ip, settings.default_olt_model)

        if olt_ip in ip_to_model:
            logger.info(f"Modelo configurado para {olt_ip}: {model}")
        else:
            logger.debug(f"Usando modelo padrão para {olt_ip}: {model}")

        return model

