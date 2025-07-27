from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["authentication"])

# TODO: Implement authentication endpoints
# - POST /auth/signup - User registration
# - POST /auth/login - User login
# - POST /auth/refresh - Token refresh
# - POST /auth/logout - User logout

@router.get("/")
def auth_info() -> dict:
    """
    Authentication endpoints information.
    
    Returns:
        dict: Available authentication endpoints
    """
    return {
        "message": "Authentication endpoints coming soon",
        "planned_endpoints": [
            "POST /auth/signup",
            "POST /auth/login", 
            "POST /auth/refresh",
            "POST /auth/logout"
        ],
        "status": "planned"
    } 