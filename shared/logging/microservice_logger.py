"""
Logger principal para microserviços.

Implementa logging assíncrono com routing inteligente,
fallback local e rate limiting.
"""

import asyncio
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from contextlib import asynccontextmanager
import aio_pika
import aiofiles
from pathlib import Path

from .config import LoggingConfig, EventTypeConfig, LogLevel
from .routing import LogRouter, LogDestination


class RateLimiter:
    """Rate limiter simples para controlar volume de logs."""

    def __init__(self, max_per_second: int, burst_size: int, window_seconds: int = 60):
        self.max_per_second = max_per_second
        self.burst_size = burst_size
        self.window_seconds = window_seconds
        self.tokens = burst_size
        self.last_refill = time.time()
        self.requests_in_window = []

    async def acquire(self) -> bool:
        """
        Tenta adquirir token para envio de log.

        Returns:
            True se pode enviar, False se rate limited
        """
        now = time.time()

        # Refill tokens baseado no tempo
        time_passed = now - self.last_refill
        tokens_to_add = time_passed * self.max_per_second
        self.tokens = min(self.burst_size, self.tokens + tokens_to_add)
        self.last_refill = now

        # Limpar requests antigas da janela
        window_start = now - self.window_seconds
        self.requests_in_window = [
            req_time for req_time in self.requests_in_window
            if req_time > window_start
        ]

        # Verificar se pode enviar
        if self.tokens >= 1 and len(self.requests_in_window) < (self.max_per_second * self.window_seconds):
            self.tokens -= 1
            self.requests_in_window.append(now)
            return True

        return False


class LocalFileLogger:
    """Logger local para fallback quando RabbitMQ indisponível."""

    def __init__(self, file_path: str, max_size_mb: int = 100):
        self.file_path = Path(file_path)
        self.max_size_bytes = max_size_mb * 1024 * 1024

        # Criar diretório se não existe
        self.file_path.parent.mkdir(parents=True, exist_ok=True)

    async def write(self, log_entry: Dict[str, Any]) -> None:
        """
        Escreve log em arquivo local.

        Args:
            log_entry: Entrada de log para escrever
        """
        try:
            # Verificar tamanho do arquivo
            if self.file_path.exists() and self.file_path.stat().st_size > self.max_size_bytes:
                await self._rotate_file()

            # Escrever log
            log_line = json.dumps(log_entry, ensure_ascii=False, default=str) + "\n"

            async with aiofiles.open(self.file_path, mode='a', encoding='utf-8') as f:
                await f.write(log_line)

        except Exception as e:
            # Última tentativa: print para stderr
            print(f"CRITICAL: Failed to write to local log file: {e}", file=sys.stderr)
            print(f"Log entry: {log_entry}", file=sys.stderr)

    async def _rotate_file(self) -> None:
        """Rotaciona arquivo quando atinge tamanho máximo."""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            rotated_path = self.file_path.with_suffix(f".{timestamp}.log")
            self.file_path.rename(rotated_path)
        except Exception as e:
            print(f"Failed to rotate log file: {e}", file=sys.stderr)


class RabbitMQPublisher:
    """Publisher assíncrono para RabbitMQ."""

    def __init__(self, config: LoggingConfig):
        self.config = config
        self.connection: Optional[aio_pika.Connection] = None
        self.channel: Optional[aio_pika.Channel] = None
        self.exchange: Optional[aio_pika.Exchange] = None
        self._connection_lock = asyncio.Lock()

    async def connect(self) -> bool:
        """
        Conecta ao RabbitMQ.

        Returns:
            True se conectou com sucesso
        """
        try:
            async with self._connection_lock:
                if self.connection and not self.connection.is_closed:
                    return True

                self.connection = await aio_pika.connect_robust(
                    self.config.transport.url,
                    timeout=self.config.transport.timeout_ms / 1000
                )

                self.channel = await self.connection.channel()
                await self.channel.set_qos(prefetch_count=100)

                self.exchange = await self.channel.declare_exchange(
                    self.config.transport.exchange,
                    aio_pika.ExchangeType.TOPIC,
                    durable=True
                )

                return True

        except Exception as e:
            print(f"Failed to connect to RabbitMQ: {e}", file=sys.stderr)
            return False

    async def publish(self,
                     routing_key: str,
                     message: Dict[str, Any],
                     retry_count: int = 0) -> bool:
        """
        Publica mensagem no RabbitMQ.

        Args:
            routing_key: Chave de roteamento
            message: Mensagem para publicar
            retry_count: Contador de tentativas

        Returns:
            True se publicou com sucesso
        """
        try:
            if not await self.connect():
                return False

            message_body = json.dumps(message, ensure_ascii=False, default=str)

            await self.exchange.publish(
                aio_pika.Message(
                    message_body.encode('utf-8'),
                    content_type='application/json',
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    timestamp=datetime.now()
                ),
                routing_key=routing_key
            )

            return True

        except Exception as e:
            print(f"Failed to publish to RabbitMQ: {e}", file=sys.stderr)

            # Retry logic
            if retry_count < self.config.transport.retry_attempts:
                await asyncio.sleep(self.config.transport.retry_delay_ms / 1000)
                return await self.publish(routing_key, message, retry_count + 1)

            return False

    async def close(self) -> None:
        """Fecha conexão com RabbitMQ."""
        try:
            if self.connection and not self.connection.is_closed:
                await self.connection.close()
        except Exception as e:
            print(f"Error closing RabbitMQ connection: {e}", file=sys.stderr)


class MicroserviceLogger:
    """
    Logger principal para microserviços.

    Implementa logging assíncrono com routing inteligente,
    fallback local e rate limiting.
    """

    def __init__(self, service_name: str, config: LoggingConfig):
        self.service_name = service_name
        self.config = config
        self.router = LogRouter()
        self.rate_limiter = RateLimiter(
            config.rate_limit.max_per_second,
            config.rate_limit.burst_size,
            config.rate_limit.window_seconds
        )
        self.publisher = RabbitMQPublisher(config)
        self.local_logger = LocalFileLogger(
            config.fallback.path,
            config.fallback.max_size_mb
        )
        self.event_types_registry: Dict[str, EventTypeConfig] = {}

    def register_event_types(self, event_types: List[EventTypeConfig]) -> None:
        """
        Registra tipos de evento conhecidos.

        Args:
            event_types: Lista de configurações de eventos
        """
        for event_type in event_types:
            self.event_types_registry[event_type.name] = event_type

    async def log(self,
                 level: str,
                 event_type: str,
                 message: str,
                 **context) -> bool:
        """
        Envia log de forma assíncrona.

        Args:
            level: Nível do log (debug, info, warning, error, critical)
            event_type: Tipo do evento
            message: Mensagem do log
            **context: Contexto adicional

        Returns:
            True se log foi enviado com sucesso
        """
        try:
            # Verificar filtros
            if not self._should_log(level, event_type):
                return True

            # Rate limiting
            if not await self.rate_limiter.acquire():
                # Log rate limited para arquivo local
                await self.local_logger.write({
                    "timestamp": datetime.now().isoformat(),
                    "level": "WARNING",
                    "message": f"Rate limited: {event_type}",
                    "service": self.service_name
                })
                return False

            # Construir entrada de log
            log_entry = await self._build_log_entry(level, event_type, message, context)

            # Determinar destino
            event_config = self.event_types_registry.get(event_type)
            destination = self.router.determine_destination(
                event_type, event_config, level, context
            )

            # Enriquecer com metadados
            log_entry = self.router.enrich_log_metadata(log_entry, destination, event_config)

            # Enviar para destino apropriado
            if destination == LogDestination.LOCAL_FILE:
                await self.local_logger.write(log_entry)
                return True
            else:
                # Enviar via RabbitMQ
                routing_key = self.router.get_routing_key(
                    self.service_name, destination, level, event_type
                )

                success = await self.publisher.publish(routing_key, log_entry)

                if not success:
                    # Fallback para arquivo local
                    await self.local_logger.write(log_entry)

                return success

        except Exception as e:
            # Última tentativa: log local
            await self.local_logger.write({
                "timestamp": datetime.now().isoformat(),
                "level": "ERROR",
                "message": f"Logger internal error: {e}",
                "service": self.service_name,
                "original_event": event_type
            })
            return False

    async def _build_log_entry(self,
                              level: str,
                              event_type: str,
                              message: str,
                              context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Constrói entrada de log padronizada.

        Args:
            level: Nível do log
            event_type: Tipo do evento
            message: Mensagem
            context: Contexto adicional

        Returns:
            Log entry formatado
        """
        # Extrair campos especiais do contexto
        trace_id = context.pop("trace_id", str(uuid.uuid4()))
        session_id = context.pop("session_id", None)
        user_id = context.pop("user_id", None)
        customer_id = context.pop("customer_id", None)

        log_entry = {
            # Campos obrigatórios
            "timestamp": datetime.now().isoformat(),
            "service_name": self.service_name,
            "service_version": self.config.service_version,
            "level": level.upper(),
            "event_type": event_type,
            "message": message,
            "trace_id": trace_id,

            # Campos opcionais
            "session_id": session_id,
            "user_id": user_id,
            "customer_id": customer_id,

            # Contexto adicional
            "context": context,

            # Metadados do sistema
            "log_version": "1.0",
            "processed_at": datetime.now().isoformat()
        }

        # Remover campos None
        return {k: v for k, v in log_entry.items() if v is not None}

    def _should_log(self, level: str, event_type: str) -> bool:
        """
        Verifica se log deve ser enviado baseado em filtros.

        Args:
            level: Nível do log
            event_type: Tipo do evento

        Returns:
            True se deve logar
        """
        # Verificar nível mínimo
        level_priority = {
            "debug": 0,
            "info": 1,
            "warning": 2,
            "error": 3,
            "critical": 4
        }

        min_level_priority = level_priority.get(self.config.filters.min_level.value, 1)
        current_level_priority = level_priority.get(level.lower(), 1)

        if current_level_priority < min_level_priority:
            return False

        # Verificar padrões de exclusão
        for pattern in self.config.filters.exclude_patterns:
            if pattern in event_type:
                return False

        # Verificar padrões de inclusão (se especificados)
        if self.config.filters.include_only:
            return any(pattern in event_type for pattern in self.config.filters.include_only)

        return True

    # Métodos de conveniência
    async def debug(self, event_type: str, message: str, **context) -> bool:
        """Log de debug."""
        return await self.log("debug", event_type, message, **context)

    async def info(self, event_type: str, message: str, **context) -> bool:
        """Log informativo."""
        return await self.log("info", event_type, message, **context)

    async def warning(self, event_type: str, message: str, **context) -> bool:
        """Log de aviso."""
        return await self.log("warning", event_type, message, **context)

    async def error(self, event_type: str, message: str, **context) -> bool:
        """Log de erro."""
        return await self.log("error", event_type, message, **context)

    async def critical(self, event_type: str, message: str, **context) -> bool:
        """Log crítico."""
        return await self.log("critical", event_type, message, **context)

    async def close(self) -> None:
        """Fecha conexões do logger."""
        await self.publisher.close()


import sys  # Import necessário para stderr