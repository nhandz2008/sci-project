from fastapi import APIRouter

router = APIRouter(prefix="/competitions", tags=["competitions"])

# TODO: Implement competition endpoints
# - GET /competitions - List competitions with filtering
# - GET /competitions/{id} - Get competition details
# - POST /competitions - Create new competition
# - PUT /competitions/{id} - Update competition
# - DELETE /competitions/{id} - Delete competition

@router.get("/")
def competitions_info() -> dict:
    """
    Competitions endpoints information.
    
    Returns:
        dict: Available competition endpoints
    """
    return {
        "message": "Competition endpoints coming soon",
        "planned_endpoints": [
            "GET /competitions",
            "GET /competitions/{id}",
            "POST /competitions",
            "PUT /competitions/{id}",
            "DELETE /competitions/{id}"
        ],
        "status": "planned"
    } 