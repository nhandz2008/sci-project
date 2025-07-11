from fastapi import APIRouter

# We'll import these route modules as we create them
# from app.api.routes import auth, users, competitions, recommendations

# Create the main API router
api_router = APIRouter()

# Health check endpoint
@api_router.get("/health")
def health_check():
    """
    Simple health check endpoint.
    
    This is useful for:
    - Load balancer health checks
    - Monitoring systems
    - Verifying the API is running
    
    Returns:
        Simple status message
    """
    return {"status": "healthy", "message": "Science Competitions Insight API is running"}

# We'll include the route modules here as we create them:
# api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
# api_router.include_router(users.router, prefix="/users", tags=["users"])
# api_router.include_router(competitions.router, prefix="/competitions", tags=["competitions"])
# api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"]) 