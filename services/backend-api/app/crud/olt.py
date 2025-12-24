from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
from datetime import datetime

from app.models.olt import Olt
from app.models.olt_port import OltPort  
from app.models.olt_setup_log import OltSetupLog
from app.schemas.olt import OLTCreate, OLTUpdate
from app.schemas.olt_setup import OltSetupLogCreate, OltSetupLogUpdate
from app.crud.utils import apply_updates


def get_olt(db: Session, olt_id: int):
    return db.query(Olt).filter(Olt.id == olt_id).first()


def get_olts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Olt).offset(skip).limit(limit).all()


def get_olt_by_name(db: Session, name: str):
    return db.query(Olt).filter(Olt.name == name).first()


def get_olt_by_ip(db: Session, ip_address: str):
    """Busca OLT pelo endereço IP."""
    return db.query(Olt).filter(Olt.ip_address == ip_address).first()


def get_olts_by_setup_status(db: Session, setup_status: str) -> List[Olt]:
    """Retorna OLTs filtradas por status de configuração."""
    return db.query(Olt).filter(Olt.setup_status == setup_status).all()


def get_unconfigured_olts(db: Session) -> List[Olt]:
    """Retorna OLTs que ainda não foram configuradas."""
    return db.query(Olt).filter(Olt.is_configured == False).all()


def get_olt_port(db: Session, olt_id: int, slot: int, port_number: int):
    return db.query(OltPort).filter(OltPort.olt_id == olt_id, OltPort.slot == slot, OltPort.port_number == port_number).first()


def create_olt(db: Session, olt: OLTCreate):
    db_olt = Olt(**olt.dict())
    db.add(db_olt)
    db.commit()
    db.refresh(db_olt)
    return db_olt


def update_olt(db: Session, olt_id: int, olt: OLTUpdate):
    db_olt = get_olt(db, olt_id)
    if db_olt:
        apply_updates(db_olt, olt)
        db.commit()
        db.refresh(db_olt)
    return db_olt


def update_olt_setup_status(db: Session, olt_id: int, setup_status: str, is_configured: bool = None):
    """Atualiza o status de configuração de uma OLT."""
    db_olt = get_olt(db, olt_id)
    if db_olt:
        db_olt.setup_status = setup_status
        if is_configured is not None:
            db_olt.is_configured = is_configured
        if setup_status == "configured" and is_configured:
            db_olt.last_sync_at = func.now()
        db.commit()
        db.refresh(db_olt)
    return db_olt


def mark_olt_as_discovered(db: Session, olt_id: int, vendor: str = None, model: str = None):
    """Marca uma OLT como descoberta com informações opcionais de vendor/modelo."""
    db_olt = get_olt(db, olt_id)
    if db_olt:
        db_olt.discovered_at = func.now()
        if vendor:
            db_olt.vendor = vendor
        if model:
            db_olt.model = model
        db.commit()
        db.refresh(db_olt)
    return db_olt


def delete_olt(db: Session, olt_id: int):
    db_olt = get_olt(db, olt_id)
    if db_olt:
        db.delete(db_olt)
        db.commit()
    return db_olt


# CRUD para OLT Setup Logs

def create_setup_log(db: Session, setup_log: OltSetupLogCreate) -> OltSetupLog:
    """Cria um novo log de configuração."""
    db_log = OltSetupLog(**setup_log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


def update_setup_log(db: Session, log_id: int, setup_log: OltSetupLogUpdate) -> Optional[OltSetupLog]:
    """Atualiza um log de configuração existente."""
    db_log = db.query(OltSetupLog).filter(OltSetupLog.id == log_id).first()
    if db_log:
        apply_updates(db_log, setup_log)
        db.commit()
        db.refresh(db_log)
    return db_log


def get_setup_logs_by_olt(db: Session, olt_id: int, limit: int = 50) -> List[OltSetupLog]:
    """Retorna logs de configuração de uma OLT específica."""
    return (db.query(OltSetupLog)
            .filter(OltSetupLog.olt_id == olt_id)
            .order_by(OltSetupLog.started_at.desc())
            .limit(limit)
            .all())


def get_recent_setup_logs(db: Session, limit: int = 100) -> List[OltSetupLog]:
    """Retorna logs de configuração mais recentes."""
    return (db.query(OltSetupLog)
            .order_by(OltSetupLog.started_at.desc())
            .limit(limit)
            .all())
