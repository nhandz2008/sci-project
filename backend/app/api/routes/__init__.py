# Routes package exports
from .health import router as health_router
from .utils import router as utils_router
from .auth import router as auth_router
from .competitions import router as competitions_router
from .users import router as users_router

# Export all routers for easy importing
__all__ = [
    "health_router", 
    "utils_router", 
    "auth_router", 
    "competitions_router", 
    "users_router"
] 