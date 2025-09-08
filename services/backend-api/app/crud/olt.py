from sqlalchemy.orm import Session
from app.models.olt import Olt
from app.models.olt_port import OltPort
from app.schemas.olt import OLTCreate, OLTUpdate


def get_olt(db: Session, olt_id: int):
    return db.query(Olt).filter(Olt.id == olt_id).first()


def get_olts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Olt).offset(skip).limit(limit).all()


def get_olt_by_name(db: Session, name: str):
    return db.query(Olt).filter(Olt.name == name).first()


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
        update_data = olt.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_olt, key, value)
        db.commit()
        db.refresh(db_olt)
    return db_olt


def delete_olt(db: Session, olt_id: int):
    db_olt = get_olt(db, olt_id)
    if db_olt:
        db.delete(db_olt)
        db.commit()
    return db_olt