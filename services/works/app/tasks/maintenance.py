import logging
from celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.maintenance.cleanup_old_tasks")
def cleanup_old_tasks():
    import redis
    import os
    from datetime import datetime, timedelta
    
    logger.info("[Celery] Iniciando limpeza de tarefas antigas...")
    
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "redis"),
        password=os.getenv("REDIS_PASSWORD", "password"),
        decode_responses=True
    )
    
    try:
        results = redis_client.lrange("task_results", 0, -1)
        import json
        cutoff = datetime.now() - timedelta(days=7)
        kept = []
        removed = 0
        
        for result in results:
            try:
                task = json.loads(result)
                kept.append(result)
            except:
                removed += 1
        
        if kept:
            redis_client.delete("task_results")
            redis_client.rpush("task_results", *kept)
        
        logger.info(f"[Celery] Limpeza concluída: {removed} itens removidos")
        return {"removed": removed, "kept": len(kept)}
        
    except Exception as e:
        logger.error(f"[Celery] Erro na limpeza: {e}")
        raise


@celery_app.task(name="app.tasks.maintenance.health_check")
def health_check():
    import redis
    import os
    
    try:
        redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "redis"),
            password=os.getenv("REDIS_PASSWORD", "password"),
            decode_responses=True
        )
        redis_client.ping()
        return {"status": "healthy", "service": "celery-worker"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
