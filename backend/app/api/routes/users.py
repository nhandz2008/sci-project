from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional
from uuid import UUID
from sqlmodel import Session, select
from pydantic import BaseModel

from app.api.deps import SessionDep, CurrentActiveUser, CurrentAdminUser
from app.crud import get_users, get_user_by_id, update_user, get_user_by_email
from app.models import User, UserUpdate, UserPublic, UsersPublic, UpdatePassword, Message, UserRole
from app.core.security import get_password_hash, verify_password

router = APIRouter(prefix="/users", tags=["users"])

# User Management endpoints - Phase 7.2 implementation

@router.get("/me", response_model=UserPublic, summary="Get current user profile")
def get_current_user_profile(
    current_user: CurrentActiveUser,
) -> UserPublic:
    """
    Get current authenticated user's profile information.
    - **Authenticated endpoint**
    - Returns current user's profile
    - Convenience endpoint for users to get their own information
    """
    return current_user

@router.put("/me/password", response_model=Message, summary="Change current user password")
def change_current_user_password(
    password_data: UpdatePassword,
    session: SessionDep,
    current_user: CurrentActiveUser,
) -> Message:
    """
    Change current user's password. Requires current password verification.
    - **Authenticated endpoint**
    - Verifies current password before allowing change
    - Returns 400 if current password is incorrect
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )
    
    # Update password
    hashed_new_password = get_password_hash(password_data.new_password)
    current_user.hashed_password = hashed_new_password
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return Message(message="Password updated successfully")

@router.put("/me", response_model=UserPublic, summary="Update current user profile")
def update_current_user_profile(
    user_in: UserUpdate,
    session: SessionDep,
    current_user: CurrentActiveUser,
) -> UserPublic:
    """
    Update current user's profile. Convenience endpoint for self-service profile updates.
    - **Authenticated endpoint**
    - Validates email uniqueness if email is being updated
    - Returns 400 for validation errors
    """
    # Check email uniqueness if email is being updated
    if user_in.email and user_in.email != current_user.email:
        existing_user = get_user_by_email(session=session, email=user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="A user with this email already exists"
            )
    
    # Update user
    updated_user = update_user(session=session, db_user=current_user, user_in=user_in)
    return updated_user

@router.get("/{id}", response_model=UserPublic, summary="Get user profile by ID")
def get_user_profile(
    id: UUID,
    session: SessionDep,
    current_user: CurrentActiveUser,
) -> UserPublic:
    """
    Get user profile by ID. Users can view their own profile, admins can view any profile.
    - **Authenticated endpoint**
    - **Authorization**: Self or admin access only
    - Returns 404 if user not found, 403 if not authorized
    """
    # Check if user exists
    user = get_user_by_id(session=session, user_id=id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check authorization: users can view their own profile, admins can view any profile
    if current_user.id != id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403, 
            detail="Not authorized to view this user's profile"
        )
    
    return user 

@router.put("/{id}", response_model=UserPublic, summary="Update user profile")
def update_user_profile(
    id: UUID,
    user_in: UserUpdate,
    session: SessionDep,
    current_user: CurrentActiveUser,
) -> UserPublic:
    """
    Update user profile. Users can update their own profile, admins can update any profile.
    - **Authenticated endpoint**
    - **Authorization**: Self or admin access only
    - Validates email uniqueness if email is being updated
    - Returns 404 if user not found, 403 if not authorized, 400 for validation errors
    """
    # Check if user exists
    db_user = get_user_by_id(session=session, user_id=id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check authorization: users can update their own profile, admins can update any profile
    if current_user.id != id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403, 
            detail="Not authorized to update this user's profile"
        )
    
    # Check email uniqueness if email is being updated
    if user_in.email and user_in.email != db_user.email:
        existing_user = get_user_by_email(session=session, email=user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="A user with this email already exists"
            )
    
    # Update user
    updated_user = update_user(session=session, db_user=db_user, user_in=user_in)
    return updated_user

@router.get("/", response_model=UsersPublic, summary="List users (admin only)")
def list_users(
    session: SessionDep,
    current_admin_user: CurrentAdminUser,
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Results per page (max 100)"),
) -> UsersPublic:
    """
    List all users with pagination. Admin access only.
    - **Admin-only endpoint**
    - Supports pagination (skip, limit)
    - Returns 403 if user not admin
    """
    users = get_users(session=session, skip=skip, limit=limit)
    return UsersPublic(data=users, count=len(users)) 

class RoleUpdate(BaseModel):
    role: UserRole

@router.put("/{id}/role", response_model=UserPublic, summary="Change user role (admin only)")
def change_user_role(
    id: UUID,
    role_update: RoleUpdate,
    session: SessionDep,
    current_admin_user: CurrentAdminUser,
) -> UserPublic:
    """
    Change user role. Admin access only with business rule protection.
    - **Admin-only endpoint**
    - Prevents demoting the last admin user
    - Returns 404 if user not found, 403 if not admin, 400 for business rule violations
    """
    # Check if user exists
    db_user = get_user_by_id(session=session, user_id=id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Business rule: Prevent demoting the last admin
    if db_user.role == UserRole.ADMIN and role_update.role == UserRole.CREATOR:
        # Count total admin users
        admin_users = session.exec(select(User).where(User.role == UserRole.ADMIN)).all()
        if len(admin_users) <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot demote the last admin user"
            )
    
    # Update user role
    db_user.role = role_update.role
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    return db_user 

@router.delete("/{id}", response_model=Message, summary="Delete user (admin only)")
def delete_user(
    id: UUID,
    session: SessionDep,
    current_admin_user: CurrentAdminUser,
) -> Message:
    """
    Delete user account. Admin access only with business rule protection.
    - **Admin-only endpoint**
    - Implements soft delete (sets is_active=False)
    - Prevents deleting the last admin user
    - Returns 404 if user not found, 403 if not admin, 400 for business rule violations
    """
    # Check if user exists
    db_user = get_user_by_id(session=session, user_id=id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Business rule: Prevent deleting the last admin
    if db_user.role == UserRole.ADMIN:
        # Count total admin users
        admin_users = session.exec(select(User).where(User.role == UserRole.ADMIN)).all()
        if len(admin_users) <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the last admin user"
            )
    
    # Soft delete: set is_active=False
    db_user.is_active = False
    session.add(db_user)
    session.commit()
    
    return Message(message="User deleted successfully") 