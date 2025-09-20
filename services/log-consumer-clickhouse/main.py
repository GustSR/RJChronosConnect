"""
ClickHouse Consumer para logs operacionais.

Consome mensagens de logs operacionais do RabbitMQ e persiste no ClickHouse
otimizado para time-series e alto volume (800K+ logs/dia).
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List

import aio_pika
import clickhouse_connect
from clickhouse_connect.driver.client import Client


class OperationalLog:
    """Modelo para logs operacionais."""

    def __init__(self, **kwargs):
        # Identificadores
        self.event_date = kwargs.get("event_date")
        self.event_datetime = kwargs.get("event_datetime")
        self.trace_id = kwargs.get("trace_id")
        self.message_id = kwargs.get("message_id", str(uuid.uuid4()))

        # Metadados do serviço
        self.service_name = kwargs.get("service_name")
        self.service_version = kwargs.get("service_version")

        # Informações do evento
        self.event_type = kwargs.get("event_type")
        self.level = kwargs.get("level")
        self.message = kwargs.get("message")
        self.category = kwargs.get("category", "operational")

        # Equipamentos e monitoramento
        self.olt_id = kwargs.get("olt_id")
        self.ont_id = kwargs.get("ont_id")
        self.port_id = kwargs.get("port_id")
        self.equipment_type = kwargs.get("equipment_type")

        # Métricas operacionais
        self.metric_name = kwargs.get("metric_name")
        self.metric_value = kwargs.get("metric_value")
        self.metric_unit = kwargs.get("metric_unit")

        # Status e performance
        self.status = kwargs.get("status")
        self.response_time_ms = kwargs.get("response_time_ms")
        self.error_code = kwargs.get("error_code")

        # Localização e cliente
        self.customer_id = kwargs.get("customer_id")
        self.region = kwargs.get("region")
        self.city = kwargs.get("city")

        # Contexto adicional (JSON como string)
        self.context_json = json.dumps(kwargs.get("context", {})) if kwargs.get("context") else "{}"

        # Timestamps
        self.processed_at = datetime.now()

        # Metadados de processamento
        self.routing_key = kwargs.get("routing_key")
        self.queue_name = kwargs.get("queue_name")


class ClickHouseConsumer:
    """Consumer de logs operacionais para ClickHouse."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.connection: Optional[aio_pika.Connection] = None
        self.channel: Optional[aio_pika.Channel] = None
        self.clickhouse_client: Optional[Client] = None
        self.is_running = False
        self.batch_size = config.get("batch_size", 1000)
        self.batch_timeout = config.get("batch_timeout", 30)
        self.current_batch: List[OperationalLog] = []
        self.last_batch_time = datetime.now()

    async def setup_clickhouse(self):
        """Configura conexão com ClickHouse."""
        try:
            ch_config = self.config["clickhouse"]

            self.clickhouse_client = clickhouse_connect.get_client(
                host=ch_config["host"],
                port=ch_config.get("port", 8123),
                username=ch_config.get("username", "default"),
                password=ch_config.get("password", ""),
                database=ch_config.get("database", "logs")
            )

            # Criar tabela se não existe
            await self._create_table()

            print("Conexão ClickHouse estabelecida com sucesso")

        except Exception as e:
            print(f"Erro ao configurar ClickHouse: {e}")
            raise

    async def _create_table(self):
        """Cria tabela otimizada para logs operacionais."""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS operational_logs (
            event_date Date,
            event_datetime DateTime64(3),
            trace_id String,
            message_id String,

            service_name LowCardinality(String),
            service_version LowCardinality(String),

            event_type LowCardinality(String),
            level LowCardinality(String),
            message String,
            category LowCardinality(String),

            olt_id Nullable(UInt32),
            ont_id Nullable(UInt64),
            port_id Nullable(UInt16),
            equipment_type LowCardinality(Nullable(String)),

            metric_name LowCardinality(Nullable(String)),
            metric_value Nullable(Float64),
            metric_unit LowCardinality(Nullable(String)),

            status LowCardinality(Nullable(String)),
            response_time_ms Nullable(UInt32),
            error_code Nullable(String),

            customer_id Nullable(UInt32),
            region LowCardinality(Nullable(String)),
            city LowCardinality(Nullable(String)),

            context_json String,

            processed_at DateTime64(3),
            routing_key String,
            queue_name LowCardinality(String)
        )
        ENGINE = MergeTree()
        PARTITION BY toYYYYMM(event_date)
        ORDER BY (event_date, service_name, event_type, event_datetime)
        TTL event_date + INTERVAL 6 MONTH
        SETTINGS index_granularity = 8192
        """

        try:
            self.clickhouse_client.command(create_table_sql)
            print("Tabela operational_logs criada/verificada com sucesso")
        except Exception as e:
            print(f"Erro ao criar tabela ClickHouse: {e}")
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
            await self.channel.set_qos(prefetch_count=rabbitmq_config.get("prefetch_count", 100))

            # Declarar exchange
            self.exchange = await self.channel.declare_exchange(
                rabbitmq_config["exchange"],
                aio_pika.ExchangeType.TOPIC,
                durable=True
            )

            # Declarar queue para logs operacionais
            self.operational_queue = await self.channel.declare_queue(
                rabbitmq_config["operational_queue"],
                durable=True,
                arguments={
                    "x-message-ttl": 3600000,  # TTL de 1 hora
                    "x-max-length": 50000,     # Máximo 50k mensagens na queue
                    "x-dead-letter-exchange": f"{rabbitmq_config['exchange']}.dlx"
                }
            )

            # Bind routing patterns para logs operacionais
            routing_patterns = rabbitmq_config.get("operational_routing_patterns", [
                "*.*.operational",
                "*.info.operational",
                "*.debug.operational"
            ])

            for pattern in routing_patterns:
                await self.operational_queue.bind(self.exchange, pattern)
                print(f"Queue vinculada ao padrão: {pattern}")

            print("Conexão RabbitMQ estabelecida com sucesso")

        except Exception as e:
            print(f"Erro ao configurar RabbitMQ: {e}")
            raise

    async def process_message(self, message: aio_pika.IncomingMessage):
        """Processa uma mensagem de log operacional."""
        async with message.process():
            try:
                # Parse da mensagem
                log_data = json.loads(message.body.decode('utf-8'))

                # Converter para modelo ClickHouse
                operational_log = await self._convert_to_model(log_data, message.routing_key)

                # Adicionar ao batch
                self.current_batch.append(operational_log)

                # Verificar se deve fazer flush do batch
                if (len(self.current_batch) >= self.batch_size or
                    (datetime.now() - self.last_batch_time).total_seconds() >= self.batch_timeout):
                    await self._flush_batch()

            except json.JSONDecodeError as e:
                print(f"Erro ao decodificar JSON: {e}")
            except Exception as e:
                print(f"Erro ao processar mensagem: {e}")

    async def _convert_to_model(self, log_data: Dict[str, Any], routing_key: str) -> OperationalLog:
        """Converte dados de log para modelo ClickHouse."""

        # Parse do timestamp
        event_datetime = datetime.fromisoformat(
            log_data["timestamp"].replace("Z", "+00:00")
        )
        event_date = event_datetime.date()

        # Extrair métricas do contexto
        context = log_data.get("context", {})
        metric_name = context.get("metric_name")
        metric_value = context.get("metric_value")
        metric_unit = context.get("metric_unit")

        # Extrair informações de equipamento
        olt_id = context.get("olt_id")
        ont_id = context.get("ont_id")
        port_id = context.get("port_id")
        equipment_type = context.get("equipment_type")

        # Performance
        response_time_ms = context.get("response_time_ms")
        error_code = context.get("error_code")
        status = context.get("status")

        # Localização
        region = context.get("region")
        city = context.get("city")

        operational_log = OperationalLog(
            event_date=event_date,
            event_datetime=event_datetime,
            trace_id=log_data.get("trace_id", str(uuid.uuid4())),
            service_name=log_data["service_name"],
            service_version=log_data.get("service_version", "unknown"),
            event_type=log_data["event_type"],
            level=log_data["level"].upper(),
            message=log_data["message"],
            category=log_data.get("category", "operational"),
            olt_id=olt_id,
            ont_id=ont_id,
            port_id=port_id,
            equipment_type=equipment_type,
            metric_name=metric_name,
            metric_value=metric_value,
            metric_unit=metric_unit,
            status=status,
            response_time_ms=response_time_ms,
            error_code=error_code,
            customer_id=log_data.get("customer_id"),
            region=region,
            city=city,
            context=context,
            routing_key=routing_key,
            queue_name=self.config["rabbitmq"]["operational_queue"]
        )

        return operational_log

    async def _flush_batch(self):
        """Envia batch para ClickHouse."""
        if not self.current_batch:
            return

        try:
            # Preparar dados para inserção
            data = []
            for log in self.current_batch:
                data.append([
                    log.event_date,
                    log.event_datetime,
                    log.trace_id,
                    log.message_id,
                    log.service_name,
                    log.service_version,
                    log.event_type,
                    log.level,
                    log.message,
                    log.category,
                    log.olt_id,
                    log.ont_id,
                    log.port_id,
                    log.equipment_type,
                    log.metric_name,
                    log.metric_value,
                    log.metric_unit,
                    log.status,
                    log.response_time_ms,
                    log.error_code,
                    log.customer_id,
                    log.region,
                    log.city,
                    log.context_json,
                    log.processed_at,
                    log.routing_key,
                    log.queue_name
                ])

            # Inserir em batch
            self.clickhouse_client.insert(
                table="operational_logs",
                data=data,
                column_names=[
                    "event_date", "event_datetime", "trace_id", "message_id",
                    "service_name", "service_version", "event_type", "level",
                    "message", "category", "olt_id", "ont_id", "port_id",
                    "equipment_type", "metric_name", "metric_value", "metric_unit",
                    "status", "response_time_ms", "error_code", "customer_id",
                    "region", "city", "context_json", "processed_at",
                    "routing_key", "queue_name"
                ]
            )

            print(f"✅ Batch de {len(self.current_batch)} logs inserido no ClickHouse")

            # Limpar batch
            self.current_batch.clear()
            self.last_batch_time = datetime.now()

        except Exception as e:
            print(f"❌ Erro ao inserir batch no ClickHouse: {e}")
            # Em caso de erro, limpar batch para evitar loop infinito
            self.current_batch.clear()

    async def _batch_flush_scheduler(self):
        """Scheduler para flush periódico de batches."""
        while self.is_running:
            try:
                await asyncio.sleep(self.batch_timeout)

                if (self.current_batch and
                    (datetime.now() - self.last_batch_time).total_seconds() >= self.batch_timeout):
                    await self._flush_batch()

            except Exception as e:
                print(f"Erro no scheduler de batch: {e}")

    async def start_consuming(self):
        """Inicia o consumo de mensagens."""
        try:
            await self.setup_clickhouse()
            await self.setup_rabbitmq()

            # Configurar consumer
            await self.operational_queue.consume(self.process_message)

            self.is_running = True

            # Iniciar scheduler de flush
            flush_task = asyncio.create_task(self._batch_flush_scheduler())

            print("🚀 ClickHouse Consumer iniciado - aguardando logs operacionais...")

            # Manter consumidor rodando
            while self.is_running:
                await asyncio.sleep(1)

            # Cancelar scheduler
            flush_task.cancel()

            # Flush final
            await self._flush_batch()

        except Exception as e:
            print(f"Erro fatal no consumer: {e}")
            await self.stop()
            raise

    async def stop(self):
        """Para o consumer gracefully."""
        print("🛑 Parando ClickHouse Consumer...")
        self.is_running = False

        # Flush final
        await self._flush_batch()

        if self.connection and not self.connection.is_closed:
            await self.connection.close()

        if self.clickhouse_client:
            self.clickhouse_client.close()

        print("ClickHouse Consumer parado")


async def main():
    """Função principal."""
    import os

    config = {
        "clickhouse": {
            "host": os.getenv("CLICKHOUSE_HOST", "localhost"),
            "port": int(os.getenv("CLICKHOUSE_PORT", "8123")),
            "username": os.getenv("CLICKHOUSE_USER", "default"),
            "password": os.getenv("CLICKHOUSE_PASSWORD", ""),
            "database": os.getenv("CLICKHOUSE_DATABASE", "logs")
        },
        "rabbitmq": {
            "url": os.getenv("RABBITMQ_URL", "amqp://localhost:5672"),
            "exchange": os.getenv("RABBITMQ_EXCHANGE", "system.logs"),
            "operational_queue": os.getenv("RABBITMQ_OPERATIONAL_QUEUE", "logs.clickhouse.operational"),
            "operational_routing_patterns": [
                "*.*.operational",
                "*.info.operational",
                "*.debug.operational"
            ],
            "prefetch_count": int(os.getenv("RABBITMQ_PREFETCH_COUNT", "100")),
            "timeout": int(os.getenv("RABBITMQ_TIMEOUT", "30"))
        },
        "batch_size": int(os.getenv("CLICKHOUSE_BATCH_SIZE", "1000")),
        "batch_timeout": int(os.getenv("CLICKHOUSE_BATCH_TIMEOUT", "30"))
    }

    consumer = ClickHouseConsumer(config)

    try:
        await consumer.start_consuming()
    except KeyboardInterrupt:
        print("Interrompido pelo usuário")
    finally:
        await consumer.stop()


if __name__ == "__main__":
    asyncio.run(main())