from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import asyncio

from app import schemas
from app.crud import user as crud_user
from app.core import security
from app.core.logging import log_user_action, log_security_event
from app.database.database import get_db

router = APIRouter()

@router.post("/token", response_model=schemas.token.Token)
async def login_for_access_token(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = crud_user.get_user_by_email(db, email=form_data.username)

    # Capturar IP do cliente para auditoria
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    if not user or not security.verify_password(form_data.password, user.password_hash):
        # Log de tentativa de login falhada (evento de segurança crítico)
        asyncio.create_task(
            log_security_event(
                "unauthorized_access_attempt",
                "warning",
                f"Tentativa de login falhada para email: {form_data.username}",
                attempted_email=form_data.username,
                ip_address=client_ip,
                user_agent=user_agent,
                failure_reason="invalid_credentials"
            )
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = security.create_access_token(
        data={"sub": user.email}
    )

    # Log de login bem-sucedido (evento crítico para auditoria LGPD)
    asyncio.create_task(
        log_user_action(
            user.id,
            "user_login",
            {
                "email": user.email,
                "login_method": "password",
                "token_created": True
            },
            ip_address=client_ip,
            user_agent=user_agent,
            session_id=access_token[:12]  # Primeiros 12 chars como identificador de sessão
        )
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.user.User)
async def read_users_me(current_user: schemas.user.User = Depends(security.get_current_user)):
    return current_user
