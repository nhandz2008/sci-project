"""Authentication routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import get_current_active_user
from app.core.db import get_session
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    verify_password_reset_token,
)
from app.crud.user import (
    authenticate_user,
    create_user,
    get_user_by_email,
    update_user_password,
)
from app.models.user import User
from app.schemas.auth import (
    MessageResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/signup", response_model=UserResponse)
async def signup(
    user_create: UserCreate, session: Annotated[Session, Depends(get_session)]
) -> UserResponse:
    """Register a new user."""
    try:
        user = create_user(session, user_create)
        return UserResponse.model_validate(user)
    except ValueError as e:
        if "already exists" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(
    user_login: UserLogin, session: Annotated[Session, Depends(get_session)]
) -> TokenResponse:
    """Login user and return access token."""
    user = authenticate_user(session, user_login.email, user_login.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token(subject=str(user.id))

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    password_reset: PasswordResetRequest,
    session: Annotated[Session, Depends(get_session)],
) -> MessageResponse:
    """Request password reset."""
    user = get_user_by_email(session, password_reset.email)

    if user and user.is_active:
        # Generate password reset token
        reset_token = create_password_reset_token(password_reset.email)

        # TODO: Send email with reset token
        # For now, just log it
        print(f"Password reset token for {password_reset.email}: {reset_token}")

    # Always return success to prevent email enumeration
    return MessageResponse(
        message="If the email exists, a password reset link has been sent"
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    password_reset: PasswordResetConfirm,
    session: Annotated[Session, Depends(get_session)],
) -> MessageResponse:
    """Reset password with token."""
    # Verify reset token
    email = verify_password_reset_token(password_reset.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    # Get user by email
    user = get_user_by_email(session, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    # Update password
    update_user_password(session, user, password_reset.new_password)

    return MessageResponse(message="Password has been reset successfully")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> UserResponse:
    """Get current user information."""
    return UserResponse.model_validate(current_user)
