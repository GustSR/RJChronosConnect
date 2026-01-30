"""API Router para Subscribers (Clientes)."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.crud import subscriber as crud_subscriber
from app.schemas.subscriber import (
    SubscriberCreate,
    SubscriberUpdate,
    SubscriberResponse,
)

router = APIRouter()


@router.get("", response_model=List[SubscriberResponse])
def list_subscribers(
    skip: int = Query(0, ge=0, description="Número de registros para pular"),
    limit: int = Query(100, ge=1, le=500, description="Limite de registros"),
    search: Optional[str] = Query(None, description="Busca por nome, CPF/CNPJ, email ou telefone"),
    db: Session = Depends(get_db),
):
    """Listar todos os subscribers com paginação e busca opcional."""
    return crud_subscriber.get_subscribers(db, skip=skip, limit=limit, search=search)


@router.get("/count")
def count_subscribers(
    search: Optional[str] = Query(None, description="Busca por nome, CPF/CNPJ, email ou telefone"),
    db: Session = Depends(get_db),
):
    """Retornar contagem total de subscribers."""
    count = crud_subscriber.get_subscribers_count(db, search=search)
    return {"count": count}


@router.get("/{subscriber_id}", response_model=SubscriberResponse)
def get_subscriber(
    subscriber_id: int,
    db: Session = Depends(get_db),
):
    """Buscar subscriber por ID."""
    db_subscriber = crud_subscriber.get_subscriber(db, subscriber_id)
    if not db_subscriber:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return db_subscriber


@router.post("", response_model=SubscriberResponse, status_code=201)
def create_subscriber(
    subscriber_in: SubscriberCreate,
    db: Session = Depends(get_db),
):
    """Criar novo subscriber."""
    # Verificar se já existe subscriber com mesmo CPF/CNPJ
    existing = crud_subscriber.get_subscriber_by_cpf_cnpj(db, subscriber_in.cpf_cnpj)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Já existe um cliente com este CPF/CNPJ"
        )
    
    return crud_subscriber.create_subscriber(db, subscriber_in)


@router.put("/{subscriber_id}", response_model=SubscriberResponse)
def update_subscriber(
    subscriber_id: int,
    subscriber_in: SubscriberUpdate,
    db: Session = Depends(get_db),
):
    """Atualizar subscriber existente."""
    # Se estiver atualizando CPF/CNPJ, verificar se já existe
    if subscriber_in.cpf_cnpj:
        existing = crud_subscriber.get_subscriber_by_cpf_cnpj(db, subscriber_in.cpf_cnpj)
        if existing and existing.id != subscriber_id:
            raise HTTPException(
                status_code=400,
                detail="Já existe um cliente com este CPF/CNPJ"
            )
    
    db_subscriber = crud_subscriber.update_subscriber(db, subscriber_id, subscriber_in)
    if not db_subscriber:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    return db_subscriber


@router.delete("/{subscriber_id}", status_code=204)
def delete_subscriber(
    subscriber_id: int,
    db: Session = Depends(get_db),
):
    """Deletar subscriber por ID."""
    success = crud_subscriber.delete_subscriber(db, subscriber_id)
    if not success:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return None
