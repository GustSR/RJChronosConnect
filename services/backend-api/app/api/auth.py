from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime

from app.schemas.user import User

router = APIRouter()
security = HTTPBearer(auto_error=False)

# Mock data
mock_user = User(
    id="user-001",
    email="admin@rjchronos.com",
    first_name="Admin",
    last_name="RJChronos",
    role="admin",
    created_at=datetime.now()
)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Mock authentication - in production, validate JWT token
    return mock_user

@router.get("/user", response_model=User)
async def get_user(current_user: User = Depends(get_current_user)):
    return current_user