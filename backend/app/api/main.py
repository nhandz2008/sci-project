"""Main API router."""

from fastapi import APIRouter

from app.api.routes import auth, users

# Create main API router
api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
