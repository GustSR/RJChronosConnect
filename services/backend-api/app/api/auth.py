"""Endpoints de autenticacao.

Login/registro agora sao gerenciados pelo Edge (Better Auth).
O Backend apenas expoe /me para retornar o usuario autenticado.
"""

from fastapi import APIRouter, Depends

from app.schemas.user import UserResponse
from app.core.security import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user=Depends(get_current_user)):
    """Retorna dados do usuario autenticado."""
    return current_user
