from typing import List, Optional
from datetime import datetime
import logging

from ..schemas.task import ActivityLog

logger = logging.getLogger(__name__)

# In-memory storage (temporary)
activity_history: List[ActivityLog] = []

async def log_activity(
    device_id: Optional[str],
    device_name: Optional[str], 
    action: str,
    description: str,
    executed_by: Optional[str] = "admin",
    status: str = "success",
    result: Optional[str] = None,
    metadata: Optional[dict] = None,
    serial_number: Optional[str] = None
):
    """
    Helper function to create activity log entries
    """
    try:
        # Simplified, use timezone in production
        brazil_now = datetime.now()
        activity = ActivityLog(
            id=f"activity-{int(brazil_now.timestamp())}-{len(activity_history)}",
            device_id=device_id,
            device_name=device_name or f"Device {device_id}" if device_id else "Sistema",
            action=action,
            description=description,
            executed_by=executed_by,
            timestamp=brazil_now,
            status=status,
            result=result,
            metadata=metadata
        )
        
        activity_history.insert(0, activity)
        
        if len(activity_history) > 100:
            activity_history[:] = activity_history[:100]
        
        logger.info(f"📝 Activity logged: {action} for {device_name or device_id}")
        return activity
        
    except Exception as e:
        logger.error(f"Error logging activity: {e}")
        return None
