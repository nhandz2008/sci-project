from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
def health_check() -> dict:
    """
    Health check endpoint for the SCI API.
    
    Returns:
        dict: Status information about the API
    """
    return {
        "status": "ok",
        "message": "Science Competitions Insight API is running",
        "version": "1.0.0"
    }


@router.get("/ping")
def ping() -> dict:
    """
    Simple ping endpoint for load balancers and monitoring.
    
    Returns:
        dict: Simple ping response
    """
    return {"ping": "pong"} 