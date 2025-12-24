from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...database.database import get_db
from ...crud import olt as crud_olt

router = APIRouter()


@router.get("/stats/overview")
def get_olt_overview_stats(db: Session = Depends(get_db)):
    """
    Obtém estatísticas gerais das OLTs.
    """
    all_olts = crud_olt.get_olts(db)

    total = len(all_olts)
    configured = len([olt for olt in all_olts if olt.is_configured])
    pending = len([olt for olt in all_olts if olt.setup_status == "pending"])
    failed = len([olt for olt in all_olts if olt.setup_status == "failed"])

    return {
        "total_olts": total,
        "configured_olts": configured,
        "pending_setup": pending,
        "failed_setup": failed,
        "configuration_rate": (configured / total * 100) if total > 0 else 0,
    }
