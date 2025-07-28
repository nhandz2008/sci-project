"""
Authentication routes for SCI application.

This module provides authentication endpoints including:
- User registration (signup)
- User login with JWT tokens
- Password reset functionality
- User profile management
"""

from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from app.api.deps import SessionDep, get_current_active_user, reusable_oauth2
from app.core.config import settings
from app.core.security import (
    create_access_token,
    get_password_hash,
    generate_password_reset_token,
    verify_password_reset_token,
    add_password_reset_token_to_blacklist,
    add_access_token_to_blacklist,
)
from app.crud import (
    authenticate,
    create_user,
    get_user_by_email,
    get_user_by_id,
)
from app.models import (
    Message,
    Token,
    User,
    UserCreate,
    UserPublic,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/signup", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def signup(
    *,
    session: SessionDep,
    user_in: UserCreate,
) -> Any:
    """
    Create new user account.
    
    Args:
        session: Database session
        user_in: User creation data
        
    Returns:
        Created user information
        
    Raises:
        HTTPException: If user already exists or validation fails
    """
    # Check if user already exists
    user = get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )
    
    # Create new user
    user = create_user(session=session, user_create=user_in)
    return user


@router.post("/login", response_model=Token)
def login(
    session: SessionDep,
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    
    Note: Use 'email' as the username field in the form data.
    
    Args:
        session: Database session
        form_data: OAuth2 form data (username=email, password)
        
    Returns:
        Access token
        
    Raises:
        HTTPException: If credentials are invalid
    """
    # Authenticate user using email as username
    user = authenticate(
        session=session, 
        email=form_data.username,  # OAuth2 uses 'username' field for email
        password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    
    # Create access token only (no refresh token for simplicity)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # seconds
    }


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    session: SessionDep,
    request: ForgotPasswordRequest,
) -> Any:
    """
    Request password reset.
    
    Args:
        session: Database session
        request: ForgotPasswordRequest containing email
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If email not found
    """
    # Check if user exists
    user = get_user_by_email(session=session, email=request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email not found",
        )
    
    # Generate password reset token
    password_reset_token = generate_password_reset_token(email=request.email)
    
    # TODO: Send email with reset token
    # For now, just return the token (in production, send via email)
    return {
        "message": "Password reset email sent",
        "token": password_reset_token,  # Remove this in production
    }


@router.post("/reset-password", response_model=Message)
def reset_password(
    session: SessionDep,
    request: ResetPasswordRequest,
) -> Any:
    """
    Reset password using reset token.
    
    Args:
        session: Database session
        request: ResetPasswordRequest containing token and new_password
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If token is invalid or password is weak
    """
    # Verify reset token
    email = verify_password_reset_token(request.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token",
        )
    
    # Get user
    user = get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Validate password strength
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )
    
    # Update password
    hashed_password = get_password_hash(request.new_password)
    user.hashed_password = hashed_password
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Add token to blacklist
    add_password_reset_token_to_blacklist(request.token)
    
    return {"message": "Password updated successfully"}


@router.get("/me", response_model=UserPublic)
def read_users_me(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get current user information.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Current user information
    """
    return current_user


@router.post("/logout", response_model=Message)
def logout(
    request: Request,
    session: SessionDep,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Logout endpoint (server-side token invalidation).
    
    Note: This endpoint validates the access token and blacklists it
    to prevent reuse. The client should also remove the token from storage.
    
    Returns:
        Success message
        
    Raises:
        HTTPException: If token is invalid or user is not authenticated
    """
    # Get the authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )
    
    # Extract the token
    token = auth_header.replace("Bearer ", "")
    
    # Add token to blacklist
    add_access_token_to_blacklist(token)
    
    return {"message": "Successfully logged out"}


@router.get("/")
def auth_info() -> dict[str, Any]:
    """
    Authentication endpoints information.
    
    Returns:
        dict: Available authentication endpoints
    """
    return {
        "message": "Authentication endpoints available",
        "endpoints": [
            "POST /auth/signup - User registration",
            "POST /auth/login - User login with JWT token",
            "POST /auth/forgot-password - Request password reset",
            "POST /auth/reset-password - Reset password with token",
            "GET /auth/me - Get current user information",
            "POST /auth/logout - Logout (server-side token invalidation)",
        ],
        "status": "implemented"
    } 