# -*- coding: utf-8 -*-
"""
Este módulo contém a implementação do receptor de Traps SNMP.

Ele é responsável por escutar notificações assíncronas enviadas pela OLT,
processá-las e, futuramente, encaminhá-las para outros serviços através de
uma fila de mensagens (como RabbitMQ).
"""

import threading
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
        else:
            logger.info(f"Trap não reconhecido ({trap_oid_str}) de {remetente}. Não será publicado.")

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
        
        logger.debug(f"Dados decodificados do trap de mudança de estado: {mensagem}")
        self.rabbitmq_publisher.publicar_mensagem(
            exchange_name='olt_events',
            routing_key=f"olt.{olt_ip}.ont.state_change",
            mensagem=mensagem
        )

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

        logger.debug(f"Dados decodificados do trap de alarme: {mensagem}")
        self.rabbitmq_publisher.publicar_mensagem(
            exchange_name='olt_events',
            routing_key=f"olt.{olt_ip}.ont.alarm",
            mensagem=mensagem
        )

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
            Modelo detectado (padrão: MA5600T)
        """
        # Por enquanto retorna padrão, mas pode ser expandido para:
        # - Manter mapeamento IP -> modelo em configuração
        # - Consultar base de dados
        # - Usar SNMP sysDescr para detectar automaticamente
        
        # Exemplo de mapeamento simples (pode ser movido para config)
        ip_to_model = {
            # "192.168.1.1": "MA5600T",
            # "192.168.1.2": "MA5800",
        }
        
        model = ip_to_model.get(olt_ip, "MA5600T")
        logger.debug(f"Modelo detectado para {olt_ip}: {model}")
        return model

