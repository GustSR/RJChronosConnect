"""Schemas Pydantic para Subscriber (Cliente)."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class SubscriberBase(BaseModel):
    """Campos base do subscriber."""
    full_name: str = Field(..., min_length=2, max_length=255, description="Nome completo")
    cpf_cnpj: str = Field(..., min_length=11, max_length=18, description="CPF ou CNPJ")
    email: Optional[str] = Field(None, max_length=255, description="Email")
    phone_number: Optional[str] = Field(None, max_length=20, description="Telefone")
    address_street: Optional[str] = Field(None, max_length=500, description="Endereço")


class SubscriberCreate(SubscriberBase):
    """Schema para criação de subscriber."""
    pass


class SubscriberUpdate(BaseModel):
    """Schema para atualização de subscriber (todos opcionais)."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    cpf_cnpj: Optional[str] = Field(None, min_length=11, max_length=18)
    email: Optional[str] = Field(None, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=20)
    address_street: Optional[str] = Field(None, max_length=500)


class SubscriberResponse(SubscriberBase):
    """Schema de resposta com campos adicionais."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
