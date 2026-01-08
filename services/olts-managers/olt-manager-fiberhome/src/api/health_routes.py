from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Health check")
def health_check():
    return {
        "status": "healthy",
        "service": "olt-manager-fiberhome",
        "version": "0.1.0",
    }
