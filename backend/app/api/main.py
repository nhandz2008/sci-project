"""Main API router."""

from fastapi import APIRouter

from app.api.routes import admin, auth, competitions, users

# Create main API router
api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    competitions.router, prefix="/competitions", tags=["competitions"]
)
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
