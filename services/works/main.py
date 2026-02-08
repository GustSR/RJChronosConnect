import pika
import json
import asyncio
import logging
import time
from app.core.config import settings
from app.handlers.provisioning import ProvisioningHandler
from app.handlers.reconfiguration import ReconfigurationHandler
import redis

# Configuração de Logs
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("WorkerOrquestrador")

def get_redis():
    while True:
        try:
            r = redis.Redis(
                host=settings.REDIS_HOST,
                password=settings.REDIS_PASS,
                decode_responses=True
            )
            r.ping()
            logger.info("Conectado ao Redis com sucesso!")
            return r
        except Exception as e:
            logger.warning(f"Aguardando Redis ficar pronto... ({e})")
            time.sleep(5)

async def process_message(ch, method, properties, body, redis_client):
    try:
        data = json.loads(body)
        event_type = data.get("event_type", "provisioning")
        
        if event_type == "provisioning":
            handler = ProvisioningHandler(redis_client)
            await handler.handle(data)
        elif event_type == "reconfigure_wan":
            handler = ReconfigurationHandler(redis_client)
            await handler.handle(data)
        
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        logger.error(f"Erro ao processar mensagem: {e}")
        # Em produção, poderíamos enviar para uma Dead Letter Queue (DLQ)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def main():
    logger.info("Iniciando Worker Orquestrador...")
    
    # Conexão RabbitMQ com retentativa
    credentials = pika.PlainCredentials(settings.RABBITMQ_USER, settings.RABBITMQ_PASS)
    parameters = pika.ConnectionParameters(host=settings.RABBITMQ_HOST, credentials=credentials)
    
    connection = None
    while True:
        try:
            connection = pika.BlockingConnection(parameters)
            break
        except Exception as e:
            logger.warning(f"Aguardando RabbitMQ ficar pronto... ({e})")
            time.sleep(5)
            
    channel = connection.channel()
    
    channel.queue_declare(queue='task_queue', durable=True)
    channel.basic_qos(prefetch_count=1)
    
    redis_client = get_redis()

    def callback(ch, method, properties, body):
        # Como o Pika é síncrono e nossos handlers são assíncronos (httpx),
        # usamos o loop de eventos para rodar o processamento.
        asyncio.run(process_message(ch, method, properties, body, redis_client))

    channel.basic_consume(queue='task_queue', on_message_callback=callback)
    
    logger.info("Worker pronto e aguardando eventos na fila 'task_queue'...")
    channel.start_consuming()

if __name__ == "__main__":
    main()