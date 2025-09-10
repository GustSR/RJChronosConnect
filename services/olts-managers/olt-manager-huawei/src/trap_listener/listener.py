# -*- coding: utf-8 -*-
"""
Este módulo contém a implementação do receptor de Traps SNMP.

Ele é responsável por escutar notificações assíncronas enviadas pela OLT,
processá-las e, futuramente, encaminhá-las para outros serviços através de
uma fila de mensagens (como RabbitMQ).
"""

import os
import threading
from pysnmp.entity import engine, config
from pysnmp.carrier.asyncore.dgram import udp
from pysnmp.entity.rfc3413 import ntfrcv
from pysnmp.proto.rfc1902 import ObjectName

from ..rabbitmq_publisher import RabbitMQPublisher

# --- Mapeamento de OIDs importantes ---
# OID padrão para identificar o tipo de trap no varbind
SNMP_TRAP_OID_VARBIND = '1.3.6.1.6.3.1.1.4.1.0'

# --- Traps e Varbinds de Mudança de Estado ---
TRAP_OID_ONT_STATE_CHANGE = '1.3.6.1.4.1.2011.6.128.1.1.2.0.6'
VARBIND_OID_IF_INDEX = '1.3.6.1.2.1.2.2.1.1' # ifIndex
VARBIND_OID_ONT_RUN_STATUS = '1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9' # hwGponDeviceOntOnlineState
VARBIND_OID_ONT_SERIAL = '1.3.6.1.4.1.2011.6.128.1.1.2.43.1.1' # hwGponOntSerialNum

# --- Traps e Varbinds de Alarme Óptico ---
TRAP_OID_ONT_ALARM = '1.3.6.1.4.1.2011.6.128.1.1.2.0.5' # hwGponDeviceOntAlarmTrap
VARBIND_OID_ALARM_ID = '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.1.1' # hwOntAlarmProfileId
VARBIND_OID_ALARM_VALUE = '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.1.2' # hwOntAlarmProfileValue
VARBIND_OID_ALARM_STATUS = '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.1.3' # hwOntAlarmProfileStatus (1: active, 2: cleared)


class TrapListener:
    """Encapsula a lógica para receber e processar traps SNMP."""

    def __init__(self):
        """
        Inicializa o listener de traps, buscando a configuração de variáveis de ambiente.
        """
        self.host = os.getenv('TRAP_LISTENER_HOST', '0.0.0.0')
        self.port = int(os.getenv('TRAP_LISTENER_PORT', 162))
        self.community = os.getenv('SNMP_COMMUNITY', 'public')
        rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
        
        self.snmp_engine = engine.SnmpEngine()
        self._thread = None
        self.rabbitmq_publisher = RabbitMQPublisher(host=rabbitmq_host)

    def _configurar_transporte(self):
        """Configura o transporte UDP para o motor SNMP."""
        try:
            config.addTransport(
                self.snmp_engine,
                udp.domainName + (1,),
                udp.UdpTransport().openServerMode((self.host, self.port))
            )
            print(f"[Trap Listener] Escutando em {self.host}:{self.port}")
        except Exception as e:
            print(f"[Erro no Listener] Falha ao abrir a porta UDP {self.port}: {e}")
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
        
        var_binds_dict = {oid.prettyPrint(): val for oid, val in var_binds}
        trap_oid = var_binds_dict.get(SNMP_TRAP_OID_VARBIND)

        if not trap_oid:
            print(f"[Trap Inesperado de {remetente}] Não foi possível determinar o OID do trap.")
            return

        trap_oid_str = str(trap_oid)
        print(f"\n--- Trap Recebido de {remetente} (OID: {trap_oid_str}) ---")

        if trap_oid_str == TRAP_OID_ONT_STATE_CHANGE:
            self._decodificar_mudanca_estado_ont(var_binds_dict, remetente)
        elif trap_oid_str == TRAP_OID_ONT_ALARM:
            self._decodificar_alarme_ont(var_binds_dict, remetente)
        else:
            print(f"  Trap não reconhecido ({trap_oid_str}). Não será publicado.")

    def _decodificar_mudanca_estado_ont(self, var_binds_dict: dict, olt_ip: str):
        """Decodifica os dados do trap de mudança de estado da ONT e publica no RabbitMQ."""
        print("  Evento: Mudança de Estado da ONT")
        mapa_status = {1: 'online', 2: 'offline'}
        
        if_index_raw = var_binds_dict.get(VARBIND_OID_IF_INDEX)
        status_raw = var_binds_dict.get(VARBIND_OID_ONT_RUN_STATUS)
        serial_raw = var_binds_dict.get(VARBIND_OID_ONT_SERIAL)

        if_index = int(if_index_raw) if if_index_raw else None
        port_str = self._ifindex_to_port(if_index) if if_index else None

        mensagem = {
            'event_type': 'ont.state.change',
            'olt_ip': olt_ip,
            'port': port_str,
            'if_index': if_index,
            'serial_number': serial_raw.prettyPrint() if serial_raw else None,
            'status': mapa_status.get(int(status_raw), 'unknown') if status_raw else 'unknown'
        }
        
        print(f"  Dados Decodificados: {mensagem}")
        self.rabbitmq_publisher.publicar_mensagem(
            exchange_name='olt_events',
            routing_key=f"olt.{olt_ip}.ont.state_change",
            mensagem=mensagem
        )

    def _decodificar_alarme_ont(self, var_binds_dict: dict, olt_ip: str):
        """Decodifica os dados do trap de alarme da ONT e publica no RabbitMQ."""
        print("  Evento: Alarme de ONT")
        alarm_status_map = {1: 'active', 2: 'cleared'}
        
        if_index_raw = var_binds_dict.get(VARBIND_OID_IF_INDEX)
        alarm_id_raw = var_binds_dict.get(VARBIND_OID_ALARM_ID)
        alarm_value_raw = var_binds_dict.get(VARBIND_OID_ALARM_VALUE)
        alarm_status_raw = var_binds_dict.get(VARBIND_OID_ALARM_STATUS)

        if_index = int(if_index_raw) if if_index_raw else None
        port_str = self._ifindex_to_port(if_index) if if_index else None

        mensagem = {
            'event_type': 'ont.alarm',
            'olt_ip': olt_ip,
            'port': port_str,
            'if_index': if_index,
            'alarm_id': str(alarm_id_raw) if alarm_id_raw else None,
            'alarm_value': str(alarm_value_raw) if alarm_value_raw else None,
            'alarm_status': alarm_status_map.get(int(alarm_status_raw), 'unknown') if alarm_status_raw else 'unknown'
        }

        print(f"  Dados Decodificados: {mensagem}")
        self.rabbitmq_publisher.publicar_mensagem(
            exchange_name='olt_events',
            routing_key=f"olt.{olt_ip}.ont.alarm",
            mensagem=mensagem
        )

    def _ifindex_to_port(self, if_index: int) -> str:
        """Converts a proprietary ifIndex back to a frame/slot/port string."""
        # This formula needs to be accurate for the specific OLT model.
        # The logic here is a best-effort based on common Huawei structures.
        try:
            # Assuming the ifIndex for a PON port is what's sent in the trap varbind
            base_index = 4194304000
            slot_multiplier = 8192
            pon_multiplier = 256

            if if_index < base_index:
                return f"unknown_ifindex_({if_index})"

            temp = if_index - base_index
            slot = temp // slot_multiplier
            temp %= slot_multiplier
            pon_port = temp // pon_multiplier
            
            # Frame is often 0 for MA56xx series
            return f"0/{slot}/{pon_port}"
        except (TypeError, ValueError):
            return f"invalid_ifindex_({if_index})"

    def iniciar(self):
        """Inicia o listener de traps e a conexão com o RabbitMQ."""
        print("[Trap Listener] Iniciando...")
        self.rabbitmq_publisher.conectar()
        self.rabbitmq_publisher.declarar_exchange('olt_events', 'topic')
        
        self._configurar_transporte()
        self._configurar_comunidade()

        ntfrcv.NotificationReceiver(self.snmp_engine, self._processar_trap)

        self._thread = threading.Thread(target=self.snmp_engine.transportDispatcher.runDispatcher)
        self._thread.daemon = True
        self._thread.start()
        print("[Trap Listener] Iniciado e aguardando traps.")

    def parar(self):
        """Para o listener de traps e fecha as conexões."""
        if self._thread and self._thread.is_alive():
            print("[Trap Listener] Parando...")
            self.snmp_engine.transportDispatcher.closeDispatcher()
            self._thread.join()
            print("[Trap Listener] Parado.")
        
        self.rabbitmq_publisher.fechar_conexao()

