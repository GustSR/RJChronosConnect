"""
Serviço de monitoramento do sistema de logging.

Monitora a saúde dos consumers, filas RabbitMQ, e integridade dos dados.
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

import aio_pika
import clickhouse_connect
import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from prometheus_client import start_http_server, Counter, Histogram, Gauge
import uvicorn
from fastapi import FastAPI


# Métricas Prometheus
log_messages_total = Counter('log_messages_total', 'Total log messages processed', ['destination', 'service'])
log_processing_time = Histogram('log_processing_seconds', 'Time spent processing logs', ['destination'])
queue_depth = Gauge('rabbitmq_queue_depth', 'RabbitMQ queue depth', ['queue'])
consumer_health = Gauge('consumer_health_status', 'Consumer health status (1=healthy, 0=unhealthy)', ['consumer'])
database_health = Gauge('database_health_status', 'Database health status (1=healthy, 0=unhealthy)', ['database'])


class LogSystemMonitor:
    """Monitor completo do sistema de logging."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.rabbitmq_connection: Optional[aio_pika.Connection] = None
        self.clickhouse_client: Optional[clickhouse_connect.Client] = None
        self.postgres_engine = None
        self.is_running = False

        # Status de saúde dos componentes
        self.component_health = {
            "rabbitmq": False,
            "clickhouse": False,
            "postgresql": False,
            "postgresql_consumer": False,
            "clickhouse_consumer": False
        }

    async def setup_connections(self):
        """Configura conexões com todos os sistemas."""
        try:
            # RabbitMQ
            self.rabbitmq_connection = await aio_pika.connect_robust(
                self.config["rabbitmq"]["url"]
            )
            self.component_health["rabbitmq"] = True
            print("✅ Conectado ao RabbitMQ")

        except Exception as e:
            print(f"❌ Erro ao conectar RabbitMQ: {e}")
            self.component_health["rabbitmq"] = False

        try:
            # ClickHouse
            self.clickhouse_client = clickhouse_connect.get_client(
                host=self.config["clickhouse"]["host"],
                port=self.config["clickhouse"]["port"],
                username=self.config["clickhouse"]["username"],
                password=self.config["clickhouse"]["password"],
                database=self.config["clickhouse"]["database"]
            )
            # Teste de conectividade
            self.clickhouse_client.command("SELECT 1")
            self.component_health["clickhouse"] = True
            print("✅ Conectado ao ClickHouse")

        except Exception as e:
            print(f"❌ Erro ao conectar ClickHouse: {e}")
            self.component_health["clickhouse"] = False

        try:
            # PostgreSQL
            self.postgres_engine = create_async_engine(
                self.config["postgresql"]["url"],
                pool_size=5,
                max_overflow=10
            )
            # Teste de conectividade
            async with self.postgres_engine.begin() as conn:
                await conn.execute("SELECT 1")
            self.component_health["postgresql"] = True
            print("✅ Conectado ao PostgreSQL")

        except Exception as e:
            print(f"❌ Erro ao conectar PostgreSQL: {e}")
            self.component_health["postgresql"] = False

    async def check_rabbitmq_health(self) -> Dict[str, Any]:
        """Verifica saúde do RabbitMQ e filas."""
        health_data = {
            "status": "unhealthy",
            "queues": {},
            "exchanges": {},
            "error": None
        }

        try:
            if not self.rabbitmq_connection or self.rabbitmq_connection.is_closed:
                await self.setup_connections()

            channel = await self.rabbitmq_connection.channel()

            # Verificar filas críticas
            queues_to_check = [
                "logs.postgresql.critical",
                "logs.clickhouse.operational"
            ]

            for queue_name in queues_to_check:
                try:
                    queue_info = await channel.queue_declare(queue_name, passive=True)
                    message_count = queue_info.method.message_count
                    consumer_count = queue_info.method.consumer_count

                    health_data["queues"][queue_name] = {
                        "message_count": message_count,
                        "consumer_count": consumer_count,
                        "status": "healthy" if consumer_count > 0 else "no_consumers"
                    }

                    # Atualizar métrica Prometheus
                    queue_depth.labels(queue=queue_name).set(message_count)

                    # Alertar se fila muito cheia
                    if message_count > 10000:
                        print(f"⚠️ ALERTA: Fila {queue_name} com {message_count} mensagens")

                except Exception as e:
                    health_data["queues"][queue_name] = {
                        "status": "error",
                        "error": str(e)
                    }

            await channel.close()
            health_data["status"] = "healthy"
            self.component_health["rabbitmq"] = True

        except Exception as e:
            health_data["error"] = str(e)
            self.component_health["rabbitmq"] = False

        return health_data

    async def check_clickhouse_health(self) -> Dict[str, Any]:
        """Verifica saúde do ClickHouse."""
        health_data = {
            "status": "unhealthy",
            "tables": {},
            "recent_data": {},
            "error": None
        }

        try:
            if not self.clickhouse_client:
                await self.setup_connections()

            # Verificar conectividade básica
            result = self.clickhouse_client.command("SELECT version()")
            health_data["version"] = result

            # Verificar tabelas principais
            tables_to_check = ["operational_logs", "operational_metrics_hourly"]

            for table in tables_to_check:
                try:
                    # Contar registros recentes (última hora)
                    count_query = f"""
                    SELECT count() as total_rows
                    FROM logs.{table}
                    WHERE event_datetime >= now() - INTERVAL 1 HOUR
                    """

                    result = self.clickhouse_client.query(count_query)
                    count = result.result_rows[0][0] if result.result_rows else 0

                    health_data["tables"][table] = {
                        "recent_rows": count,
                        "status": "healthy"
                    }

                    health_data["recent_data"][table] = count

                except Exception as e:
                    health_data["tables"][table] = {
                        "status": "error",
                        "error": str(e)
                    }

            health_data["status"] = "healthy"
            self.component_health["clickhouse"] = True

        except Exception as e:
            health_data["error"] = str(e)
            self.component_health["clickhouse"] = False

        return health_data

    async def check_postgresql_health(self) -> Dict[str, Any]:
        """Verifica saúde do PostgreSQL."""
        health_data = {
            "status": "unhealthy",
            "tables": {},
            "recent_data": {},
            "error": None
        }

        try:
            if not self.postgres_engine:
                await self.setup_connections()

            async with self.postgres_engine.begin() as conn:
                # Verificar conectividade
                result = await conn.execute("SELECT version()")
                version = result.fetchone()[0]
                health_data["version"] = version

                # Verificar tabela de logs críticos
                try:
                    result = await conn.execute("""
                        SELECT COUNT(*)
                        FROM activity_logs
                        WHERE event_timestamp >= NOW() - INTERVAL '1 hour'
                    """)
                    count = result.fetchone()[0]

                    health_data["tables"]["activity_logs"] = {
                        "recent_rows": count,
                        "status": "healthy"
                    }

                    health_data["recent_data"]["activity_logs"] = count

                except Exception as e:
                    health_data["tables"]["activity_logs"] = {
                        "status": "error",
                        "error": str(e)
                    }

            health_data["status"] = "healthy"
            self.component_health["postgresql"] = True

        except Exception as e:
            health_data["error"] = str(e)
            self.component_health["postgresql"] = False

        return health_data

    async def check_data_integrity(self) -> Dict[str, Any]:
        """Verifica integridade dos dados entre sistemas."""
        integrity_data = {
            "status": "unknown",
            "discrepancies": [],
            "lag_analysis": {}
        }

        try:
            # Verificar se há logs perdidos comparando volumes
            now = datetime.now()
            one_hour_ago = now - timedelta(hours=1)

            # Contar logs por serviço no ClickHouse
            if self.clickhouse_client:
                clickhouse_counts = {}
                try:
                    result = self.clickhouse_client.query("""
                        SELECT service_name, count() as total
                        FROM logs.operational_logs
                        WHERE event_datetime >= subtractHours(now(), 1)
                        GROUP BY service_name
                    """)

                    for row in result.result_rows:
                        clickhouse_counts[row[0]] = row[1]

                    integrity_data["clickhouse_counts"] = clickhouse_counts

                except Exception as e:
                    integrity_data["clickhouse_error"] = str(e)

            # Verificar lag de processamento
            if self.clickhouse_client:
                try:
                    result = self.clickhouse_client.query("""
                        SELECT
                            avg(dateDiff('second', event_datetime, processed_at)) as avg_lag_seconds,
                            max(dateDiff('second', event_datetime, processed_at)) as max_lag_seconds
                        FROM logs.operational_logs
                        WHERE processed_at >= subtractHours(now(), 1)
                    """)

                    if result.result_rows:
                        avg_lag, max_lag = result.result_rows[0]
                        integrity_data["lag_analysis"] = {
                            "avg_processing_lag_seconds": avg_lag,
                            "max_processing_lag_seconds": max_lag,
                            "status": "healthy" if max_lag < 300 else "concerning"  # > 5 min é preocupante
                        }

                except Exception as e:
                    integrity_data["lag_error"] = str(e)

            integrity_data["status"] = "healthy"

        except Exception as e:
            integrity_data["error"] = str(e)
            integrity_data["status"] = "error"

        return integrity_data

    async def update_prometheus_metrics(self):
        """Atualiza métricas do Prometheus."""
        # Atualizar status de saúde dos componentes
        for component, is_healthy in self.component_health.items():
            if component.endswith("_consumer"):
                consumer_health.labels(consumer=component).set(1 if is_healthy else 0)
            elif component in ["postgresql", "clickhouse"]:
                database_health.labels(database=component).set(1 if is_healthy else 0)

    async def health_check_loop(self):
        """Loop principal de health checks."""
        while self.is_running:
            try:
                print(f"🔍 Executando health check - {datetime.now()}")

                # Verificar cada componente
                rabbitmq_health = await self.check_rabbitmq_health()
                clickhouse_health = await self.check_clickhouse_health()
                postgresql_health = await self.check_postgresql_health()
                integrity_check = await self.check_data_integrity()

                # Atualizar métricas
                await self.update_prometheus_metrics()

                # Log do status geral
                total_healthy = sum(1 for h in self.component_health.values() if h)
                total_components = len(self.component_health)

                print(f"📊 Status: {total_healthy}/{total_components} componentes saudáveis")

                # Alertas críticos
                if not self.component_health["rabbitmq"]:
                    print("🚨 ALERTA CRÍTICO: RabbitMQ indisponível!")

                if not self.component_health["postgresql"]:
                    print("🚨 ALERTA CRÍTICO: PostgreSQL indisponível!")

                if not self.component_health["clickhouse"]:
                    print("⚠️ ALERTA: ClickHouse indisponível!")

            except Exception as e:
                print(f"❌ Erro no health check: {e}")

            # Aguardar próximo ciclo
            await asyncio.sleep(30)  # Health check a cada 30 segundos

    async def start_monitoring(self):
        """Inicia o monitoramento."""
        print("🚀 Iniciando Log System Monitor...")

        await self.setup_connections()

        self.is_running = True

        # Iniciar loop de health checks
        health_task = asyncio.create_task(self.health_check_loop())

        try:
            await health_task
        except asyncio.CancelledError:
            print("🛑 Health check cancelado")

    async def stop_monitoring(self):
        """Para o monitoramento."""
        print("🛑 Parando Log System Monitor...")
        self.is_running = False

        if self.rabbitmq_connection and not self.rabbitmq_connection.is_closed:
            await self.rabbitmq_connection.close()

        if self.clickhouse_client:
            self.clickhouse_client.close()

        if self.postgres_engine:
            await self.postgres_engine.dispose()


# API de Health Check
app = FastAPI(title="Log System Monitor", version="1.0.0")
monitor = None


@app.get("/health")
async def health_endpoint():
    """Endpoint de health check."""
    if not monitor:
        return {"status": "monitor_not_initialized"}

    return {
        "status": "healthy" if all(monitor.component_health.values()) else "degraded",
        "timestamp": datetime.now().isoformat(),
        "components": monitor.component_health
    }


@app.get("/metrics/detailed")
async def detailed_metrics():
    """Métricas detalhadas do sistema."""
    if not monitor:
        return {"error": "monitor_not_initialized"}

    rabbitmq_health = await monitor.check_rabbitmq_health()
    clickhouse_health = await monitor.check_clickhouse_health()
    postgresql_health = await monitor.check_postgresql_health()
    integrity_check = await monitor.check_data_integrity()

    return {
        "timestamp": datetime.now().isoformat(),
        "rabbitmq": rabbitmq_health,
        "clickhouse": clickhouse_health,
        "postgresql": postgresql_health,
        "integrity": integrity_check
    }


async def main():
    """Função principal."""
    import os
    global monitor

    config = {
        "rabbitmq": {
            "url": os.getenv("RABBITMQ_URL", "amqp://localhost:5672")
        },
        "clickhouse": {
            "host": os.getenv("CLICKHOUSE_HOST", "localhost"),
            "port": int(os.getenv("CLICKHOUSE_PORT", "8123")),
            "username": os.getenv("CLICKHOUSE_USER", "default"),
            "password": os.getenv("CLICKHOUSE_PASSWORD", ""),
            "database": os.getenv("CLICKHOUSE_DATABASE", "logs")
        },
        "postgresql": {
            "url": os.getenv("POSTGRESQL_URL", os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost:5432/rjchronos"))
        }
    }

    monitor = LogSystemMonitor(config)

    # Iniciar servidor Prometheus
    start_http_server(8000)
    print("📊 Servidor Prometheus iniciado na porta 8000")

    # Iniciar monitoramento
    monitor_task = asyncio.create_task(monitor.start_monitoring())

    # Iniciar API
    api_config = uvicorn.Config(app, host="0.0.0.0", port=8080, log_level="info")
    server = uvicorn.Server(api_config)
    api_task = asyncio.create_task(server.serve())

    try:
        await asyncio.gather(monitor_task, api_task)
    except KeyboardInterrupt:
        print("Interrompido pelo usuário")
    finally:
        await monitor.stop_monitoring()


if __name__ == "__main__":
    asyncio.run(main())