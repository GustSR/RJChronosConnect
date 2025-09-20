"""
PostgreSQL Consumer para logs críticos.

Consome mensagens de logs críticos do RabbitMQ e persiste no PostgreSQL
com garantias de compliance LGPD/ANATEL.
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

import aio_pika
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy import Column, String, DateTime, BigInteger, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()


class CriticalLog(Base):
    """Modelo para logs críticos com compliance."""

    __tablename__ = "critical_logs"

    id = Column(BigInteger, primary_key=True)

    # Identificadores únicos
    trace_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    message_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True)

    # Metadados do serviço
    service_name = Column(String(100), nullable=False, index=True)
    service_version = Column(String(20), nullable=False)

    # Informações do evento
    event_type = Column(String(100), nullable=False, index=True)
    level = Column(String(20), nullable=False, index=True)
    message = Column(Text, nullable=False)
    category = Column(String(50), nullable=True)

    # Dados do usuário (com cuidado LGPD)
    user_id = Column(BigInteger, nullable=True, index=True)
    session_id = Column(String(100), nullable=True)
    customer_id = Column(BigInteger, nullable=True, index=True)

    # Contexto e detalhes
    context = Column(JSONB, nullable=True)

    # Compliance e auditoria
    compliance_tags = Column(JSONB, nullable=True)
    legal_basis = Column(String(100), nullable=True)
    retention_period = Column(String(50), nullable=True)
    classification = Column(String(20), default="confidential")

    # Timestamps
    event_timestamp = Column(DateTime(timezone=True), nullable=False)
    processed_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    # Metadados de processamento
    routing_key = Column(String(200), nullable=False)
    queue_name = Column(String(100), nullable=False)

    def __repr__(self):
        return f"<CriticalLog(id={self.id}, event_type='{self.event_type}', service='{self.service_name}')>"


class PostgreSQLConsumer:
    """Consumer de logs críticos para PostgreSQL."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.connection: Optional[aio_pika.Connection] = None
        self.channel: Optional[aio_pika.Channel] = None
        self.db_engine = None
        self.db_session_maker = None
        self.is_running = False

    async def setup_database(self):
        """Configura conexão com PostgreSQL."""
        try:
            db_url = self.config["database"]["url"]
            self.db_engine = create_async_engine(
                db_url,
                echo=self.config["database"].get("echo", False),
                pool_size=self.config["database"].get("pool_size", 10),
                max_overflow=self.config["database"].get("max_overflow", 20)
            )

            self.db_session_maker = async_sessionmaker(
                self.db_engine,
                class_=AsyncSession,
                expire_on_commit=False
            )

            # Criar tabelas se não existem
            async with self.db_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

            print("Conexão PostgreSQL estabelecida com sucesso")

        except Exception as e:
            print(f"Erro ao configurar PostgreSQL: {e}")
            raise

    async def setup_rabbitmq(self):
        """Configura conexão com RabbitMQ."""
        try:
            rabbitmq_config = self.config["rabbitmq"]

            self.connection = await aio_pika.connect_robust(
                rabbitmq_config["url"],
                timeout=rabbitmq_config.get("timeout", 30)
            )

            self.channel = await self.connection.channel()
            await self.channel.set_qos(prefetch_count=rabbitmq_config.get("prefetch_count", 10))

            # Declarar exchange
            self.exchange = await self.channel.declare_exchange(
                rabbitmq_config["exchange"],
                aio_pika.ExchangeType.TOPIC,
                durable=True
            )

            # Declarar queue para logs críticos
            self.critical_queue = await self.channel.declare_queue(
                rabbitmq_config["critical_queue"],
                durable=True,
                arguments={
                    "x-message-ttl": 3600000,  # TTL de 1 hora
                    "x-dead-letter-exchange": f"{rabbitmq_config['exchange']}.dlx"
                }
            )

            # Bind routing patterns para logs críticos
            routing_patterns = rabbitmq_config.get("critical_routing_patterns", [
                "*.*.critical",
                "*.error.critical",
                "*.warning.critical"
            ])

            for pattern in routing_patterns:
                await self.critical_queue.bind(self.exchange, pattern)
                print(f"Queue vinculada ao padrão: {pattern}")

            print("Conexão RabbitMQ estabelecida com sucesso")

        except Exception as e:
            print(f"Erro ao configurar RabbitMQ: {e}")
            raise

    async def process_message(self, message: aio_pika.IncomingMessage):
        """Processa uma mensagem de log crítico."""
        async with message.process():
            try:
                # Parse da mensagem
                log_data = json.loads(message.body.decode('utf-8'))

                # Validar campos obrigatórios
                required_fields = ["service_name", "event_type", "level", "message", "timestamp"]
                missing_fields = [field for field in required_fields if field not in log_data]

                if missing_fields:
                    print(f"Campos obrigatórios ausentes: {missing_fields}")
                    return

                # Converter para modelo PostgreSQL
                critical_log = await self._convert_to_model(log_data, message.routing_key)

                # Persistir no banco
                await self._save_to_database(critical_log)

                print(f"Log crítico processado: {log_data['event_type']} de {log_data['service_name']}")

            except json.JSONDecodeError as e:
                print(f"Erro ao decodificar JSON: {e}")
            except Exception as e:
                print(f"Erro ao processar mensagem: {e}")
                # Log do erro para investigação
                await self._log_processing_error(str(e), message.routing_key)

    async def _convert_to_model(self, log_data: Dict[str, Any], routing_key: str) -> CriticalLog:
        """Converte dados de log para modelo PostgreSQL."""

        # Parse do timestamp
        event_timestamp = datetime.fromisoformat(
            log_data["timestamp"].replace("Z", "+00:00")
        )

        # Extrair contexto sem campos especiais
        context = log_data.get("context", {}).copy()

        # Criar modelo
        critical_log = CriticalLog(
            trace_id=log_data.get("trace_id", str(uuid.uuid4())),
            service_name=log_data["service_name"],
            service_version=log_data.get("service_version", "unknown"),
            event_type=log_data["event_type"],
            level=log_data["level"].upper(),
            message=log_data["message"],
            category=log_data.get("category"),
            user_id=log_data.get("user_id"),
            session_id=log_data.get("session_id"),
            customer_id=log_data.get("customer_id"),
            context=context if context else None,
            compliance_tags=log_data.get("compliance_tags"),
            legal_basis=log_data.get("legal_basis"),
            retention_period=log_data.get("retention_period"),
            classification=log_data.get("classification", "confidential"),
            event_timestamp=event_timestamp,
            routing_key=routing_key,
            queue_name=self.config["rabbitmq"]["critical_queue"]
        )

        return critical_log

    async def _save_to_database(self, critical_log: CriticalLog):
        """Salva log crítico no PostgreSQL."""
        async with self.db_session_maker() as session:
            try:
                session.add(critical_log)
                await session.commit()
            except Exception as e:
                await session.rollback()
                print(f"Erro ao salvar no PostgreSQL: {e}")
                raise

    async def _log_processing_error(self, error_msg: str, routing_key: str):
        """Registra erro de processamento."""
        error_log = CriticalLog(
            trace_id=str(uuid.uuid4()),
            service_name="log-consumer-postgresql",
            service_version="1.0.0",
            event_type="processing_error",
            level="ERROR",
            message=f"Erro ao processar log: {error_msg}",
            context={"original_routing_key": routing_key},
            event_timestamp=datetime.now(),
            routing_key="internal.error.critical",
            queue_name="internal",
            classification="internal"
        )

        try:
            await self._save_to_database(error_log)
        except Exception:
            print(f"Falha crítica: não foi possível registrar erro de processamento")

    async def start_consuming(self):
        """Inicia o consumo de mensagens."""
        try:
            await self.setup_database()
            await self.setup_rabbitmq()

            # Configurar consumer
            await self.critical_queue.consume(self.process_message)

            self.is_running = True
            print("🚀 PostgreSQL Consumer iniciado - aguardando logs críticos...")

            # Manter consumidor rodando
            while self.is_running:
                await asyncio.sleep(1)

        except Exception as e:
            print(f"Erro fatal no consumer: {e}")
            await self.stop()
            raise

    async def stop(self):
        """Para o consumer gracefully."""
        print("🛑 Parando PostgreSQL Consumer...")
        self.is_running = False

        if self.connection and not self.connection.is_closed:
            await self.connection.close()

        if self.db_engine:
            await self.db_engine.dispose()

        print("PostgreSQL Consumer parado")


async def main():
    """Função principal."""
    config = {
        "database": {
            "url": "postgresql+asyncpg://user:password@localhost:5432/rjchronos",
            "echo": False,
            "pool_size": 10,
            "max_overflow": 20
        },
        "rabbitmq": {
            "url": "amqp://localhost:5672",
            "exchange": "system.logs",
            "critical_queue": "logs.postgresql.critical",
            "critical_routing_patterns": [
                "*.*.critical",
                "*.error.critical",
                "*.warning.critical"
            ],
            "prefetch_count": 10,
            "timeout": 30
        }
    }

    consumer = PostgreSQLConsumer(config)

    try:
        await consumer.start_consuming()
    except KeyboardInterrupt:
        print("Interrompido pelo usuário")
    finally:
        await consumer.stop()


if __name__ == "__main__":
    asyncio.run(main())