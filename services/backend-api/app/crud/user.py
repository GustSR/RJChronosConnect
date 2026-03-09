from sqlalchemy.orm import Session
from app.models.user import User


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_user_by_external_id(db: Session, external_id: str):
    """Busca usuario pelo external_id (ID do Better Auth)."""
    return db.query(User).filter(User.external_id == external_id).first()


def get_or_create_user_from_edge(
    db: Session,
    external_id: str,
    email: str,
) -> User:
    """Auto-provisiona usuario local a partir dos dados do Edge.

    Se o usuario ja existe (por external_id), atualiza o email se mudou.
    Se nao existe, cria um novo usuario sem senha (auth gerenciada pelo Edge).
    """
    user = get_user_by_external_id(db, external_id)

    if user:
        if user.email != email:
            user.email = email
            db.flush()
        return user

    user = User(
        external_id=external_id,
        full_name=email,
        email=email,
        password_hash=None,
        is_active=True,
    )
    db.add(user)
    db.flush()
    return user
