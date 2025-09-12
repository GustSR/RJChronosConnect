"""
Script para popular as tabelas lookup com dados iniciais (seeds).
Execute após aplicar as migrações do banco de dados.
"""

from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.task_type import TaskType
from app.models.task_status import TaskStatus
from app.models.log_level import LogLevel
from app.models.device_status import DeviceStatus

import logging
logger = logging.getLogger(__name__)


def seed_task_types(db: Session):
    """Popula a tabela task_types com tipos de tarefas padrão."""
    task_types = [
        "reprovisionar",
        "resetar_wifi", 
        "buscar_parametros",
        "reboot_device",
        "alterar_perfil",
        "olt_discovery",
        "olt_setup_snmp", 
        "olt_setup_traps",
        "olt_setup_auto_provisioning",
        "olt_full_setup",
        "olt_verification"
    ]
    
    for task_type_name in task_types:
        existing = db.query(TaskType).filter(TaskType.name == task_type_name).first()
        if not existing:
            task_type = TaskType(name=task_type_name)
            db.add(task_type)
            logger.info(f"Adicionado task_type: {task_type_name}")
    
    db.commit()


def seed_task_statuses(db: Session):
    """Popula a tabela task_statuses com status padrão."""
    statuses = [
        "pendente",
        "em_andamento", 
        "concluida",
        "falhada",
        "cancelada"
    ]
    
    for status_name in statuses:
        existing = db.query(TaskStatus).filter(TaskStatus.name == status_name).first()
        if not existing:
            status = TaskStatus(name=status_name)
            db.add(status)
            logger.info(f"Adicionado task_status: {status_name}")
    
    db.commit()


def seed_log_levels(db: Session):
    """Popula a tabela log_levels com níveis de log padrão."""
    log_levels = [
        "info",
        "warning", 
        "error",
        "critical",
        "debug"
    ]
    
    for level_name in log_levels:
        existing = db.query(LogLevel).filter(LogLevel.name == level_name).first()
        if not existing:
            log_level = LogLevel(name=level_name)
            db.add(log_level)
            logger.info(f"Adicionado log_level: {level_name}")
    
    db.commit()


def seed_device_statuses(db: Session):
    """Popula a tabela device_statuses com status de dispositivos padrão."""
    statuses = [
        "ativo",
        "offline",
        "em_manutencao",
        "desabilitado", 
        "desconhecido",
        "provisionando"
    ]
    
    for status_name in statuses:
        existing = db.query(DeviceStatus).filter(DeviceStatus.name == status_name).first()
        if not existing:
            status = DeviceStatus(name=status_name)
            db.add(status)
            logger.info(f"Adicionado device_status: {status_name}")
    
    db.commit()


def run_all_seeds():
    """Executa todos os seeds de dados."""
    db = SessionLocal()
    
    try:
        logger.info("🌱 Iniciando população das tabelas lookup...")
        
        seed_task_types(db)
        seed_task_statuses(db)
        seed_log_levels(db)
        seed_device_statuses(db)
        
        logger.info("✅ Seeds executados com sucesso!")
        
    except Exception as e:
        logger.error(f"❌ Erro ao executar seeds: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    # Execute seeds
    run_all_seeds()