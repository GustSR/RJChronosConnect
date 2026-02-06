import aio_pika
import json
import logging
from ..core.config import settings

logger = logging.getLogger(__name__)

class RabbitMQPublisher:
    async def publish_event(self, queue_name: str, event_data: dict):
        """Publica um evento de forma assíncrona no RabbitMQ."""
        try:
            connection = await aio_pika.connect_robust(
                host=settings.RABBITMQ_HOST,
                login=settings.RABBITMQ_USER,
                password=settings.RABBITMQ_PASS
            )
            
            async with connection:
                channel = await connection.channel()
                
                # Garante que a fila existe
                await channel.declare_queue(queue_name, durable=True)
                
                # Publica a mensagem
                message_body = json.dumps(event_data).encode()
                await channel.default_exchange.publish(
                    aio_pika.Message(body=message_body, delivery_mode=aio_pika.DeliveryMode.PERSISTENT),
                    routing_key=queue_name
                )
                
                logger.info(f"Evento publicado na fila {queue_name}: {event_data.get('task_id')}")
                
        except Exception as e:
            logger.error(f"Erro ao publicar evento no RabbitMQ: {e}")
            raise

publisher = RabbitMQPublisher()
