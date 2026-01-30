"""CRUD operations para Subscriber (Cliente)."""

from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.subscriber import Subscriber
from app.schemas.subscriber import SubscriberCreate, SubscriberUpdate


def get_subscriber(db: Session, subscriber_id: int) -> Optional[Subscriber]:
    """Buscar subscriber por ID."""
    return db.query(Subscriber).filter(Subscriber.id == subscriber_id).first()


def get_subscriber_by_cpf_cnpj(db: Session, cpf_cnpj: str) -> Optional[Subscriber]:
    """Buscar subscriber por CPF/CNPJ."""
    return db.query(Subscriber).filter(Subscriber.cpf_cnpj == cpf_cnpj).first()


def get_subscribers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
) -> List[Subscriber]:
    """Listar subscribers com paginação e busca opcional."""
    query = db.query(Subscriber)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Subscriber.full_name.ilike(search_pattern),
                Subscriber.cpf_cnpj.ilike(search_pattern),
                Subscriber.email.ilike(search_pattern),
                Subscriber.phone_number.ilike(search_pattern),
            )
        )
    
    return query.order_by(Subscriber.full_name).offset(skip).limit(limit).all()


def get_subscribers_count(db: Session, search: Optional[str] = None) -> int:
    """Contar total de subscribers."""
    query = db.query(Subscriber)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Subscriber.full_name.ilike(search_pattern),
                Subscriber.cpf_cnpj.ilike(search_pattern),
                Subscriber.email.ilike(search_pattern),
                Subscriber.phone_number.ilike(search_pattern),
            )
        )
    
    return query.count()


def create_subscriber(db: Session, subscriber_in: SubscriberCreate) -> Subscriber:
    """Criar novo subscriber."""
    db_subscriber = Subscriber(
        full_name=subscriber_in.full_name,
        cpf_cnpj=subscriber_in.cpf_cnpj,
        email=subscriber_in.email,
        phone_number=subscriber_in.phone_number,
        address_street=subscriber_in.address_street,
    )
    db.add(db_subscriber)
    db.commit()
    db.refresh(db_subscriber)
    return db_subscriber


def update_subscriber(
    db: Session,
    subscriber_id: int,
    subscriber_in: SubscriberUpdate
) -> Optional[Subscriber]:
    """Atualizar subscriber existente."""
    db_subscriber = get_subscriber(db, subscriber_id)
    if not db_subscriber:
        return None
    
    update_data = subscriber_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_subscriber, field, value)
    
    db.commit()
    db.refresh(db_subscriber)
    return db_subscriber


def delete_subscriber(db: Session, subscriber_id: int) -> bool:
    """Deletar subscriber por ID."""
    db_subscriber = get_subscriber(db, subscriber_id)
    if not db_subscriber:
        return False
    
    db.delete(db_subscriber)
    db.commit()
    return True
