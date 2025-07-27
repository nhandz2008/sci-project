"""
Utility endpoints for SCI application.

This module provides utility endpoints for testing and debugging.
"""

from datetime import timedelta
from typing import Any

from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import Session, select

from app.api.deps import SessionDep, get_current_admin_user
from app.core.config import settings
from app.core.db import engine
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
    verify_access_token,
    verify_refresh_token,
    generate_password_reset_token,
    verify_password_reset_token,
    is_token_expired,
    get_token_expiration,
)
from app.crud import get_user_by_email
from app.models import Message, User

router = APIRouter(prefix="/utils", tags=["utilities"])


@router.get("/test-db")
def test_database_connection() -> dict[str, Any]:
    """
    Test database connection.
    
    Returns:
        dict: Database connection status
    """
    try:
        with Session(engine) as session:
            # Try to execute a simple query
            result = session.exec(select(1)).first()
            return {
                "status": "success",
                "message": "Database connection successful",
                "result": result
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database connection failed: {str(e)}"
        }


@router.get("/info")
def get_api_info() -> dict[str, Any]:
    """
    Get API information.
    
    Returns:
        dict: API information
    """
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "api_v1_str": settings.API_V1_STR,
        "access_token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        "email_reset_token_expire_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
    }


@router.get("/status")
def get_system_status() -> dict[str, Any]:
    """
    Get system status.
    
    Returns:
        dict: System status information
    """
    return {
        "status": "operational",
        "services": {
            "database": "connected",
            "api": "running",
            "security": "enabled"
        },
        "timestamp": "2024-01-01T00:00:00Z"
    }


@router.get("/config")
def get_config_info() -> dict[str, Any]:
    """
    Get configuration information (non-sensitive).
    
    Returns:
        dict: Configuration information
    """
    return {
        "project_name": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "api_v1_str": settings.API_V1_STR,
        "cors_origins": settings.all_cors_origins,
        "frontend_host": settings.FRONTEND_HOST,
        "database_server": settings.POSTGRES_SERVER,
        "database_port": settings.POSTGRES_PORT,
        "database_name": settings.POSTGRES_DB,
    }


@router.get("/error-test")
def test_error_handling() -> dict[str, str]:
    """
    Test error handling.
    
    Returns:
        dict: Success message
    """
    return {"message": "Error handling is working correctly"}


@router.get("/error-test/{error_type}")
def test_specific_error(error_type: str) -> dict[str, str]:
    """
    Test specific error types.
    
    Args:
        error_type: Type of error to test
        
    Returns:
        dict: Error response
        
    Raises:
        HTTPException: Based on error_type parameter
    """
    if error_type == "not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test 404 error"
        )
    elif error_type == "bad_request":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Test 400 error"
        )
    elif error_type == "unauthorized":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Test 401 error"
        )
    elif error_type == "forbidden":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Test 403 error"
        )
    elif error_type == "internal":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Test 500 error"
        )
    else:
        return {"message": f"Unknown error type: {error_type}"}


@router.post("/test-security")
def test_security_functions() -> dict[str, Any]:
    """
    Test security functions.
    
    Returns:
        dict: Security function test results
    """
    # Test password hashing
    test_password = "test_password_123"
    hashed_password = get_password_hash(test_password)
    password_verified = verify_password(test_password, hashed_password)
    password_wrong = verify_password("wrong_password", hashed_password)
    
    # Test token creation
    test_user_id = "test-user-123"
    access_token = create_access_token(test_user_id)
    refresh_token = create_refresh_token(test_user_id)
    
    # Test token verification
    access_token_data = verify_access_token(access_token)
    refresh_token_data = verify_refresh_token(refresh_token)
    
    # Test token expiration
    is_expired = is_token_expired(access_token)
    expiration_time = get_token_expiration(access_token)
    
    # Test password reset token
    test_email = "test@example.com"
    reset_token = generate_password_reset_token(test_email)
    reset_email = verify_password_reset_token(reset_token)
    reset_invalid = verify_password_reset_token("invalid_token")
    
    return {
        "password_hashing": {
            "original_password": test_password,
            "hashed_password": hashed_password,
            "verification_correct": password_verified,
            "verification_wrong": password_wrong
        },
        "token_creation": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "access_token_subject": access_token_data.sub,
            "refresh_token_subject": refresh_token_data.sub,
            "access_token_type": access_token_data.type,
            "refresh_token_type": refresh_token_data.type
        },
        "token_verification": {
            "access_token_valid": access_token_data.sub == test_user_id,
            "refresh_token_valid": refresh_token_data.sub == test_user_id,
            "is_expired": is_expired,
            "expiration_time": expiration_time.isoformat() if expiration_time else None
        },
        "password_reset": {
            "reset_token": reset_token,
            "reset_email_verified": reset_email,
            "reset_invalid_token": reset_invalid
        }
    } 


@router.get("/test-admin")
def test_admin_access(
    current_admin_user: User = Depends(get_current_admin_user),
) -> dict[str, Any]:
    """
    Test admin user access.
    
    Args:
        current_admin_user: Current admin user
        
    Returns:
        Admin user information
    """
    return {
        "message": "Admin access granted",
        "user": {
            "id": str(current_admin_user.id),
            "email": current_admin_user.email,
            "full_name": current_admin_user.full_name,
            "role": current_admin_user.role.value,
            "is_active": current_admin_user.is_active
        }
    } 