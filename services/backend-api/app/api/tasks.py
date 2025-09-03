from fastapi import APIRouter, HTTPException
from typing import List, Optional
import logging
import pika
import redis
import json
import uuid
import asyncio
import os

from app.schemas.task import TaskRequest

# Logger
logger = logging.getLogger(__name__)

# APIRouter
router = APIRouter()

# RabbitMQ connection parameters
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'rabbitmq')
TASK_QUEUE = 'task_queue'

# Redis connection parameters
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
REDIS_PORT = 6379
RESULTS_LIST = 'task_results'

def get_redis_client():
    """Creates a Redis client."""
    redis_password = os.getenv('REDIS_PASSWORD', 'password')
    return redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=0,
        password=redis_password,
        decode_responses=True
    )

def publish_task_to_rabbitmq(message: dict):
    """
    Connects to RabbitMQ and publishes a task message.
    This is a blocking function.
    """
    rabbitmq_user = os.getenv('RABBITMQ_DEFAULT_USER', 'user')
    rabbitmq_pass = os.getenv('RABBITMQ_DEFAULT_PASS', 'password')
    credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_pass)

    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=RABBITMQ_HOST, credentials=credentials)
        )
        channel = connection.channel()
        channel.queue_declare(queue=TASK_QUEUE, durable=True)
        channel.basic_publish(
            exchange='',
            routing_key=TASK_QUEUE,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # make message persistent
            ))
        connection.close()
        logger.info(f"Task {message.get('task_id')} for device {message.get('device_id')} sent to queue.")
    except pika.exceptions.AMQPConnectionError as e:
        logger.error(f"Failed to connect to RabbitMQ: {e}")
        raise

@router.post("/", status_code=202)
async def create_task(task_request: TaskRequest):
    """
    Creates a new task and sends it to the processing queue.
    """
    task_id = str(uuid.uuid4())
    message = {
        "task_id": task_id,
        "device_id": task_request.device_id,
        "action": task_request.action,
        "parameters": task_request.parameters
    }
    
    try:
        await asyncio.to_thread(publish_task_to_rabbitmq, message)
        return {"message": "Task accepted for processing", "task_id": task_id}
    except Exception as e:
        logger.error(f"An unexpected error occurred while creating a task: {e}")
        raise HTTPException(status_code=503, detail="Message broker is unavailable")

@router.get("/results", response_model=List[dict])
async def get_task_results(limit: int = 100):
    """
    Retrieves the latest task results from the results store.
    """
    try:
        r = get_redis_client()
        results_json = r.lrange(RESULTS_LIST, 0, limit - 1)
        results = [json.loads(item) for item in results_json]
        return results
    except redis.exceptions.ConnectionError as e:
        logger.error(f"Failed to connect to Redis: {e}")
        raise HTTPException(status_code=503, detail="Result store is unavailable")
    except Exception as e:
        logger.error(f"An unexpected error occurred while fetching results: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
