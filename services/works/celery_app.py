from celery import Celery
from celery.schedules import crontab
import os

CELERY_BROKER_URL = os.getenv(
    "CELERY_BROKER_URL",
    f"amqp://{os.getenv('RABBITMQ_DEFAULT_USER', 'user')}:{os.getenv('RABBITMQ_DEFAULT_PASS', 'password')}@{os.getenv('RABBITMQ_HOST', 'rabbitmq')}:5672//"
)
CELERY_RESULT_BACKEND = os.getenv(
    "CELERY_RESULT_BACKEND",
    f"redis://:{os.getenv('REDIS_PASSWORD', 'password')}@{os.getenv('REDIS_HOST', 'redis')}:6379/0"
)

celery_app = Celery(
    "rjchronos_works",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.provisioning",
        "app.tasks.reconfiguration",
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    task_soft_time_limit=270,
    worker_prefetch_multiplier=1,
    worker_concurrency=4,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_default_queue="default",
    task_queues={
        "default": {},
        "critical": {},
        "low": {},
    },
    task_routes={
        "app.tasks.provisioning.*": {"queue": "critical"},
        "app.tasks.reconfiguration.*": {"queue": "default"},
    },
    beat_schedule={
        "cleanup-old-tasks": {
            "task": "app.tasks.maintenance.cleanup_old_tasks",
            "schedule": crontab(hour=3, minute=0),
        },
    },
)

celery_app.autodiscover_tasks(["app.tasks"])
