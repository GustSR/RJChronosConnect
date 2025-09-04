from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime

from ..schemas.task import ActivityLog
from ..crud.activity import activity_history, log_activity

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[ActivityLog])
async def get_activity_history(
    device_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """
    Get activity history with optional filters.
    """
    try:
        if device_id:
            filtered = [a for a in activity_history if a.device_id == device_id]
        else:
            filtered = activity_history
        
        return filtered[offset : offset + limit]
    except Exception as e:
        logger.error(f"Error fetching activity history: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/{activity_id}", response_model=ActivityLog)
async def get_activity_by_id(activity_id: str):
    """
    Get specific activity by ID.
    """
    activity = next((a for a in activity_history if a.id == activity_id), None)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity

