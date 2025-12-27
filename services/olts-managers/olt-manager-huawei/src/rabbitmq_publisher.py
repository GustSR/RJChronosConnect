# -*- coding: utf-8 -*-
"""
Este módulo gerencia a comunicação com o RabbitMQ para publicar mensagens.
"""

import pika
import json
import time
import uuid
from datetime import datetime
from .core.config import settings
from .core.logging import get_logger

logger = get_logger(__name__)

class RabbitMQPublisher:
    """Encapsula a lógica de publicação de mensagens no RabbitMQ."""

    def __init__(self, max_retries=5, retry_delay=5):
        """
        Inicializa o publicador.
        """
        self.host = settings.rabbitmq_host
        self.port = settings.rabbitmq_port
        self.username = settings.rabbitmq_user
        self.password = settings.rabbitmq_password
        self.connection = None
        self.channel = None
        self.max_retries = max_retries
        self.retry_delay = retry_delay

    def conectar(self):
        """Estabelece a conexão com o servidor RabbitMQ com retentativas."""
        retries = 0
        while retries < self.max_retries:
            try:
                credentials = pika.PlainCredentials(self.username, self.password)
                params = pika.ConnectionParameters(
                    host=self.host,
                    port=self.port,
                    credentials=credentials,
                )
                self.connection = pika.BlockingConnection(params)
                self.channel = self.connection.channel()
                logger.info("Conectado com sucesso ao RabbitMQ.")
                return
            except pika.exceptions.AMQPConnectionError as e:
                logger.error(f"Falha ao conectar ao RabbitMQ: {e}. Tentando novamente em {self.retry_delay} segundos...")
                retries += 1
                time.sleep(self.retry_delay)
        logger.critical("Não foi possível conectar ao RabbitMQ após várias tentativas.")
        raise Exception("Não foi possível conectar ao RabbitMQ.")

    def declarar_exchange(self, exchange_name, exchange_type='topic'):
        """
        Garante que um exchange exista no RabbitMQ.
        """
        if not self.channel or self.channel.is_closed:
            self.conectar()
        self.channel.exchange_declare(exchange=exchange_name, exchange_type=exchange_type, durable=True)
        logger.info(f"Exchange '{exchange_name}' declarada.")

    def publicar_mensagem(self, exchange_name, routing_key, mensagem: dict):
        """
        Publica uma mensagem em um exchange com retry automático.
        Automaticamente adiciona metadados de timestamp e event_id se ausentes.
        """
        # Enriquece mensagem com metadados se não existirem
        mensagem_enriched = self._enrich_message(mensagem)
        max_tentativas = 3
        tentativa = 0
        
        while tentativa < max_tentativas:
            try:
                # Verifica se a conexão está válida
                if not self._is_connection_valid():
                    logger.warning(f"Conexão inválida. Tentando reconectar (tentativa {tentativa + 1}/{max_tentativas})...")
                    self.conectar()
                
                # Tenta publicar a mensagem
                self.channel.basic_publish(
                    exchange=exchange_name,
                    routing_key=routing_key,
                    body=json.dumps(mensagem_enriched, ensure_ascii=False, default=str),
                    properties=pika.BasicProperties(
                        delivery_mode=2,  # Torna a mensagem persistente
                        content_type='application/json',
                        headers={
                            'event_type': mensagem_enriched.get('event_type'),
                            'severity': mensagem_enriched.get('severity'),
                            'source': 'olt-manager-huawei'
                        }
                    )
                )
                logger.info(f"Mensagem publicada para exchange '{exchange_name}' com routing key '{routing_key}'")
                return  # Sucesso, sai do loop
                
            except (pika.exceptions.AMQPConnectionError, pika.exceptions.AMQPChannelError) as e:
                tentativa += 1
                logger.warning(f"Falha na conexão RabbitMQ (tentativa {tentativa}/{max_tentativas}): {e}")
                if tentativa < max_tentativas:
                    time.sleep(self.retry_delay)
                    # Força reconexão na próxima tentativa
                    self._force_disconnect()
                else:
                    logger.error(f"Falha definitiva ao publicar mensagem após {max_tentativas} tentativas")
                    raise
            except Exception as e:
                logger.error(f"Erro inesperado ao publicar mensagem: {e}")
                raise

    def _is_connection_valid(self) -> bool:
        """Verifica se a conexão e o canal estão válidos."""
        try:
            return (self.connection and self.connection.is_open and 
                    self.channel and self.channel.is_open)
        except Exception:
            return False
    
    def _force_disconnect(self):
        """Força o fechamento da conexão para reconectar."""
        try:
            if self.connection and self.connection.is_open:
                self.connection.close()
        except Exception as e:
            logger.debug(f"Erro ao forçar desconexão: {e}")
        finally:
            self.connection = None
            self.channel = None
    
    def fechar_conexao(self):
        """Fecha a conexão com o RabbitMQ."""
        try:
            if self.connection and self.connection.is_open:
                self.connection.close()
                logger.info("Conexão com o RabbitMQ fechada.")
        except Exception as e:
            logger.warning(f"Erro ao fechar conexão RabbitMQ: {e}")
        finally:
            self.connection = None
            self.channel = None

    def _enrich_message(self, mensagem: dict) -> dict:
        """
        Enriquece a mensagem com metadados padrão se não existirem.
        
        Args:
            mensagem: Mensagem original
            
        Returns:
            Mensagem enriquecida com metadados
        """
        enriched = mensagem.copy()
        
        # Adiciona event_id único se não existir
        if 'event_id' not in enriched:
            enriched['event_id'] = str(uuid.uuid4())
        
        # Adiciona timestamp se não existir
        if 'timestamp' not in enriched:
            enriched['timestamp'] = datetime.utcnow().isoformat() + 'Z'
        
        # Adiciona source se não existir
        if 'source' not in enriched:
            enriched['source'] = {
                'service': 'olt-manager-huawei',
                'version': '1.0.0',
                'component': 'trap-listener'
            }
        
        # Garante que severity seja lowercase para padronização
        if 'severity' in enriched:
            enriched['severity'] = enriched['severity'].lower()
        
        return enriched

    def publicar_evento_critico(self, event_type: str, data: dict, olt_ip: str):
        """
        Método conveniência para publicar eventos críticos com alta prioridade.
        
        Args:
            event_type: Tipo do evento (ex: 'ont.power.dying_gasp')
            data: Dados específicos do evento
            olt_ip: IP da OLT que originou o evento
        """
        mensagem = {
            'event_type': event_type,
            'severity': 'critical',
            'olt_ip': olt_ip,
            'data': data,
            'requires_immediate_attention': True
        }
        
        routing_key = f"critical.{olt_ip}.{event_type}"
        
        self.publicar_mensagem(
            exchange_name='olt_events_priority',
            routing_key=routing_key,
            mensagem=mensagem
        )
