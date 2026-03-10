"""Utilidades de seguranca — autenticacao via headers do Edge Gateway."""

from fastapi import Request, HTTPException, status
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


async def get_current_user(request: Request):
    """Dependency que retorna o usuario autenticado do request.state.

    O middleware EdgeAuthMiddleware popula request.state.current_user
    a partir dos headers X-User-Id/X-User-Email injetados pelo Edge.
    """
    user = getattr(request.state, "current_user", None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nao autenticado",
        )
    return user
