from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, text

from app.api.deps import get_db
from app.models import Message

router = APIRouter(prefix="/utils", tags=["utils"])


@router.get("/test-db")
def test_database_connection(session: Session = Depends(get_db)) -> dict:
    """
    Test database connection and basic operations.
    
    Args:
        session: Database session dependency
        
    Returns:
        dict: Database connection status
    """
    try:
        # Test basic database connection
        session.exec(text("SELECT 1"))
        return {
            "status": "ok",
            "message": "Database connection successful",
            "database": "PostgreSQL"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )


@router.get("/info")
def get_api_info() -> dict:
    """
    Get API information and configuration.
    
    Returns:
        dict: API information
    """
    return {
        "name": "Science Competitions Insight API",
        "version": "1.0.0",
        "description": "API for managing science competitions and recommendations",
        "status": "active"
    }


@router.get("/status")
def get_system_status(session: Session = Depends(get_db)) -> dict:
    """
    Get comprehensive system status including database and API health.
    
    Args:
        session: Database session dependency
        
    Returns:
        dict: System status information
    """
    # Test database connection
    db_status = "ok"
    try:
        session.exec(text("SELECT 1"))
    except Exception:
        db_status = "error"
    
    return {
        "api": {
            "status": "ok",
            "version": "1.0.0"
        },
        "database": {
            "status": db_status,
            "type": "PostgreSQL"
        },
        "timestamp": "2024-01-01T00:00:00Z"  # TODO: Add proper timestamp
    }


@router.get("/config")
def get_api_config() -> dict:
    """
    Get API configuration information (non-sensitive).
    
    Returns:
        dict: API configuration details
    """
    return {
        "api_version": "v1",
        "base_url": "/api/v1",
        "docs_url": "/api/v1/docs",
        "redoc_url": "/api/v1/redoc",
        "features": {
            "authentication": "planned",
            "competitions": "planned",
            "recommendations": "planned",
            "user_management": "planned"
        }
    }


@router.get("/error-test")
def test_error_handling() -> dict:
    """
    Test endpoint to verify error handling is working properly.
    
    Returns:
        dict: Success message
    """
    return {
        "message": "Error handling is working correctly",
        "status": "ok"
    }


@router.get("/error-test/{error_type}")
def test_specific_error(error_type: str) -> dict:
    """
    Test specific error types for development and testing.
    
    Args:
        error_type: Type of error to test (400, 404, 500, etc.)
        
    Returns:
        dict: Error response or success message
    """
    if error_type == "400":
        raise HTTPException(status_code=400, detail="Bad Request - Test Error")
    elif error_type == "404":
        raise HTTPException(status_code=404, detail="Not Found - Test Error")
    elif error_type == "500":
        raise HTTPException(status_code=500, detail="Internal Server Error - Test Error")
    else:
        return {
            "message": f"Unknown error type: {error_type}",
            "available_types": ["400", "404", "500"]
        } 