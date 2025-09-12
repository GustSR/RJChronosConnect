# -*- coding: utf-8 -*-
"""
Este módulo gerencia a comunicação com o RabbitMQ para publicar mensagens.
"""

import pika
import json
import time
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
        self.connection = None
        self.channel = None
        self.max_retries = max_retries
        self.retry_delay = retry_delay

    def conectar(self):
        """Estabelece a conexão com o servidor RabbitMQ com retentativas."""
        retries = 0
        while retries < self.max_retries:
            try:
                params = pika.ConnectionParameters(host=self.host, port=self.port)
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
        """
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
                    body=json.dumps(mensagem),
                    properties=pika.BasicProperties(
                        delivery_mode=2,  # Torna a mensagem persistente
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
