"""User management routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.api.deps import get_current_active_user, get_current_admin_user
from app.core.db import get_session
from app.core.security import verify_password
from app.crud.user import (
    activate_user,
    change_user_role,
    deactivate_user,
    delete_user,
    get_user_by_id,
    get_users,
    update_user,
    update_user_password,
)
from app.models.common import UserRole
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.user import (
    PasswordChange,
    UserDetailResponse,
    UserListPaginatedResponse,
    UserListResponse,
    UserUpdate,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserDetailResponse)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> UserDetailResponse:
    """Get current user profile."""
    return UserDetailResponse.model_validate(current_user)


@router.put("/me", response_model=UserDetailResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_session)],
) -> UserDetailResponse:
    """Update current user profile."""
    updated_user = update_user(session, current_user, user_update)
    return UserDetailResponse.model_validate(updated_user)


@router.put("/me/password", response_model=MessageResponse)
async def change_current_user_password(
    password_change: PasswordChange,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_session)],
) -> MessageResponse:
    """Change current user password."""
    # Verify current password
    if not verify_password(
        password_change.current_password, current_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # Update password
    update_user_password(session, current_user, password_change.new_password)

    return MessageResponse(message="Password changed successfully")


@router.get("", response_model=UserListPaginatedResponse)
async def get_users_list(
    _current_user: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[Session, Depends(get_session)],
    skip: int = Query(default=0, ge=0, description="Number of users to skip"),
    limit: int = Query(
        default=100, ge=1, le=1000, description="Number of users to return"
    ),
    role: UserRole | None = Query(default=None, description="Filter by user role"),
    is_active: bool | None = Query(default=None, description="Filter by active status"),
    search: str | None = Query(default=None, description="Search by name or email"),
) -> UserListPaginatedResponse:
    """Get users list (admin only)."""
    users, total = get_users(
        session=session,
        skip=skip,
        limit=limit,
        role=role,
        is_active=is_active,
        search=search,
    )

    return UserListPaginatedResponse(
        users=[UserListResponse.model_validate(user) for user in users],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user_by_id(
    user_id: str,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[Session, Depends(get_session)],
) -> MessageResponse:
    """Delete user by ID (admin only)."""
    from uuid import UUID

    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        )

    # Prevent admin from deleting themselves
    if user_uuid == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    # Check if user exists
    user_to_delete = get_user_by_id(session, user_uuid)
    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Delete user
    success = delete_user(session, user_uuid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user",
        )

    return MessageResponse(message="User deleted successfully")


@router.put("/{user_id}/deactivate", response_model=MessageResponse)
async def deactivate_user_by_id(
    user_id: str,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[Session, Depends(get_session)],
) -> MessageResponse:
    """Deactivate user by ID (admin only)."""
    from uuid import UUID

    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        )

    # Prevent admin from deactivating themselves
    if user_uuid == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    # Check if user exists
    user_to_deactivate = get_user_by_id(session, user_uuid)
    if not user_to_deactivate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Deactivate user
    success = deactivate_user(session, user_uuid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate user",
        )

    return MessageResponse(message="User deactivated successfully")


@router.put("/{user_id}/activate", response_model=MessageResponse)
async def activate_user_by_id(
    user_id: str,
    _current_user: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[Session, Depends(get_session)],
) -> MessageResponse:
    """Activate user by ID (admin only)."""
    from uuid import UUID

    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        )

    # Check if user exists
    user_to_activate = get_user_by_id(session, user_uuid)
    if not user_to_activate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Activate user
    success = activate_user(session, user_uuid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate user",
        )

    return MessageResponse(message="User activated successfully")


@router.put("/{user_id}/role", response_model=MessageResponse)
async def change_user_role_by_id(
    user_id: str,
    new_role: UserRole,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[Session, Depends(get_session)],
) -> MessageResponse:
    """Change user role by ID (admin only)."""
    from uuid import UUID

    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        )

    # Prevent admin from changing their own role
    if user_uuid == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role",
        )

    # Check if user exists
    user_to_change = get_user_by_id(session, user_uuid)
    if not user_to_change:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Change user role
    success = change_user_role(session, user_uuid, new_role)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change user role",
        )

    return MessageResponse(
        message=f"User role changed to {new_role.value} successfully"
    )
