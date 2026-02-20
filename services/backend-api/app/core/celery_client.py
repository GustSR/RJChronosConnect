from celery import Celery
import os

CELERY_BROKER_URL = os.getenv(
    "CELERY_BROKER_URL",
    f"amqp://{os.getenv('RABBITMQ_DEFAULT_USER', 'user')}:{os.getenv('RABBITMQ_DEFAULT_PASS', 'password')}@{os.getenv('RABBITMQ_HOST', 'rabbitmq')}:5672//"
)

celery_app = Celery(
    "rjchronos_backend",
    broker=CELERY_BROKER_URL,
    backend=CELERY_BROKER_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
