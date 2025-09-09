from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog
from app.models.log_level import LogLevel

def get_critical_alerts_count(db: Session) -> int:
    """Conta o número de logs de atividade com nível 'critical'."""
    return db.query(ActivityLog).join(LogLevel).filter(LogLevel.name == 'critical').count()
