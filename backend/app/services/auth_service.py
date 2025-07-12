from datetime import timedelta
from typing import Optional
from sqlmodel import Session
from fastapi import HTTPException, status

from app.core.security import create_access_token, get_password_hash
from app.core.config import settings
from app.models.user import User, UserRole
from app.services.user_service import authenticate_user, get_user_by_email, get_user_by_username
# UserCreate import removed - using user_service.create_user instead


def login_user(db: Session, email: str, password: str) -> dict:
    """
    Authenticate user and create access token.
    
    Args:
        db: Database session
        email: User's email address
        password: Plain text password
        
    Returns:
        Dictionary containing access token and user info
        
    Raises:
        HTTPException: If authentication fails
    """
    user = authenticate_user(db, email, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    
    # Return in the format expected by UserLoginResponse schema
    from app.schemas.user import UserResponse, Token
    
    return {
        "user": UserResponse.model_validate(user),
        "token": Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    }


# create_user function moved to user_service.py to avoid duplication


def refresh_token(db: Session, user_email: str) -> dict:
    """
    Create a new access token for an existing user.
    
    Args:
        db: Database session
        user_email: Email of the user requesting token refresh
        
    Returns:
        Dictionary containing new access token
        
    Raises:
        HTTPException: If user not found or inactive
    """
    user = get_user_by_email(db, user_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


def validate_token(token: str) -> bool:
    """
    Validate if a token is valid and not expired.
    
    Args:
        token: JWT token to validate
        
    Returns:
        True if token is valid, False otherwise
    """
    try:
        from app.core.security import verify_token
        verify_token(token)
        return True
    except HTTPException:
        return False 