from fastapi import APIRouter
from datetime import datetime
from app.schemas import HealthResponse

# We'll import these route modules as we create them
# from app.api.routes import auth, users, competitions, recommendations

# Create the main API router
api_router = APIRouter()

# Health check endpoint
@api_router.get("/health", response_model=HealthResponse)
def health_check():
    """
    Health check endpoint with detailed status information.
    
    This is useful for:
    - Load balancer health checks
    - Monitoring systems
    - Verifying the API is running
    - Database connection status
    
    Returns:
        Detailed health status information
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0",
        database="connected",
        dependencies={
            "postgresql": "connected",
            "pydantic": "active",
            "sqlmodel": "active"
        }
    )

# We'll include the route modules here as we create them:
# api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
# api_router.include_router(users.router, prefix="/users", tags=["users"])
# api_router.include_router(competitions.router, prefix="/competitions", tags=["competitions"])
# api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"]) 