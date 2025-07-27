from fastapi import APIRouter

from app.api.routes import (
    health_router, 
    utils_router, 
    auth_router, 
    competitions_router, 
    users_router
)
from app.core.config import settings

api_router = APIRouter()

# Include routers
api_router.include_router(health_router)
api_router.include_router(utils_router)
api_router.include_router(auth_router)
api_router.include_router(competitions_router)
api_router.include_router(users_router) 