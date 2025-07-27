from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["users"])

# TODO: Implement user endpoints
# - GET /users - List users (admin only)
# - GET /users/{id} - Get user profile
# - PUT /users/{id} - Update user profile
# - DELETE /users/{id} - Delete user (admin only)
# - PUT /users/{id}/role - Change user role (admin only)

@router.get("/")
def users_info() -> dict:
    """
    Users endpoints information.
    
    Returns:
        dict: Available user endpoints
    """
    return {
        "message": "User management endpoints coming soon",
        "planned_endpoints": [
            "GET /users",
            "GET /users/{id}",
            "PUT /users/{id}",
            "DELETE /users/{id}",
            "PUT /users/{id}/role"
        ],
        "status": "planned"
    } 