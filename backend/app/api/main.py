"""Main API router."""

from fastapi import APIRouter

from app.api.routes import admin, auth, competitions, users

# Create main API router
api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router, tags=["authentication"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(competitions.router, tags=["competitions"])
api_router.include_router(admin.router, tags=["admin"])
