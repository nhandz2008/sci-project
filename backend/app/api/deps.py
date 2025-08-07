"""FastAPI dependencies for authentication and authorization."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    UserNotFoundError,
)
from app.core.security import verify_token
from app.models.common import UserRole
from app.models.user import User

# Security scheme for JWT tokens
security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    session: Annotated[Session, Depends(get_session)],
) -> User:
    """Get current user from JWT token."""
    token = credentials.credentials
    user_id_str = verify_token(token)

    if user_id_str is None:
        raise AuthenticationError(
            message="Could not validate credentials",
            error_code="AUTH_003",
            details="Invalid or expired token",
        )

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise AuthenticationError(
            message="Invalid token format",
            error_code="AUTH_004",
            details="Token contains invalid user ID format",
        )

    # Get user from database
    statement = select(User).where(User.id == user_id)
    result = session.exec(statement).first()

    if result is None:
        raise UserNotFoundError(
            message="User not found",
            error_code="USER_003",
            details="User associated with token no longer exists",
        )

    return result


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise AuthenticationError(
            message="Inactive user",
            error_code="AUTH_005",
            details="User account has been deactivated",
        )
    return current_user


async def get_current_admin_user(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    """Get current admin user."""
    if current_user.role != UserRole.ADMIN:
        raise AuthorizationError(
            message="Not enough permissions",
            error_code="AUTH_006",
            details="Admin role required for this operation",
        )
    return current_user
