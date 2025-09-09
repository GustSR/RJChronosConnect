from sqlalchemy.orm import Session
from app.models.subscriber import Subscriber

def get_subscriber_by_cpf_cnpj(db: Session, cpf_cnpj: str):
    return db.query(Subscriber).filter(Subscriber.cpf_cnpj == cpf_cnpj).first()
