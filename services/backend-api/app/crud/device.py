from sqlalchemy.orm import Session
from app.models.device import Device
from app.schemas.device import DeviceCreate, DeviceUpdate
from app.crud.utils import apply_updates


def get_device(db: Session, device_id: int):
    return db.query(Device).filter(Device.id == device_id).first()


def get_devices(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Device).offset(skip).limit(limit).all()


def get_device_by_serial_number(db: Session, serial_number: str):
    return db.query(Device).filter(Device.serial_number == serial_number).first()


def create_device(db: Session, device: DeviceCreate):
    db_device = Device(**device.dict())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device


def update_device(db: Session, device_id: int, device: DeviceUpdate):
    db_device = get_device(db, device_id)
    if db_device:
        apply_updates(db_device, device)
        db.commit()
        db.refresh(db_device)
    return db_device


def delete_device(db: Session, device_id: int):
    db_device = get_device(db, device_id)
    if db_device:
        db.delete(db_device)
        db.commit()
    return db_device
