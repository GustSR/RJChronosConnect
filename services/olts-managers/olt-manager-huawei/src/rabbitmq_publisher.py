# -*- coding: utf-8 -*-
"""
Este módulo gerencia a comunicação com o RabbitMQ para publicar mensagens.
"""

import pika
import json

class RabbitMQPublisher:
    """Encapsula a lógica de publicação de mensagens no RabbitMQ."""

    def __init__(self, host='localhost', port=5672):
        """
        Inicializa o publicador.

        Args:
            host (str): O host do servidor RabbitMQ.
            port (int): A porta do servidor RabbitMQ.
        """
        self.host = host
        self.port = port
        self.connection = None
        self.channel = None

    def conectar(self):
        """Estabelece a conexão com o servidor RabbitMQ."""
        try:
            params = pika.ConnectionParameters(host=self.host, port=self.port)
            self.connection = pika.BlockingConnection(params)
            self.channel = self.connection.channel()
            print("[RabbitMQ] Conectado com sucesso.")
        except pika.exceptions.AMQPConnectionError as e:
            print(f"[Erro RabbitMQ] Falha ao conectar: {e}")
            # Em um cenário real, teríamos uma lógica de retentativa aqui.
            raise

    def declarar_exchange(self, exchange_name, exchange_type='topic'):
        """
        Garante que um exchange exista no RabbitMQ.

        Args:
            exchange_name (str): O nome do exchange.
            exchange_type (str): O tipo do exchange (ex: 'topic', 'direct', 'fanout').
        """
        if not self.channel:
            self.conectar()
        self.channel.exchange_declare(exchange=exchange_name, exchange_type=exchange_type, durable=True)
        print(f"[RabbitMQ] Exchange '{exchange_name}' declarada.")

    def publicar_mensagem(self, exchange_name, routing_key, mensagem: dict):
        """
        Publica uma mensagem em um exchange.

        Args:
            exchange_name (str): O nome do exchange para o qual publicar.
            routing_key (str): A chave de roteamento para a mensagem.
            mensagem (dict): A mensagem a ser publicada (será convertida para JSON).
        """
        if not self.channel or self.channel.is_closed:
            print("[RabbitMQ] Conexão perdida. Tentando reconectar...")
            self.conectar()
        
        try:
            self.channel.basic_publish(
                exchange=exchange_name,
                routing_key=routing_key,
                body=json.dumps(mensagem),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Torna a mensagem persistente
                )
            )
            print(f"[RabbitMQ] Mensagem publicada para exchange '{exchange_name}' com routing key '{routing_key}'")
        except Exception as e:
            print(f"[Erro RabbitMQ] Falha ao publicar mensagem: {e}")

    def fechar_conexao(self):
        """Fecha a conexão com o RabbitMQ."""
        if self.connection and self.connection.is_open:
            self.connection.close()
            print("[RabbitMQ] Conexão fechada.")
