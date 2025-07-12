from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlmodel import Session

from app.schemas.user import (
    UserCreate, 
    UserUpdate, 
    UserResponse, 
    UserListResponse,
    UserProfile
)
from app.schemas.common import MessageResponse
from app.services.user_service import (
    create_user,
    get_users_list,
    get_user_by_id,
    update_user,
    delete_user,
    deactivate_user,
    activate_user,
    get_user_statistics
)
from app.core.deps import get_db, get_current_active_user, require_admin
from app.models.user import User, UserRole

router = APIRouter()


@router.post("/register", response_model=UserResponse)
def register_user(
    user_create: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    
    This is a public endpoint that allows anyone to register as a creator.
    Only creator role accounts can be created through this endpoint.
    """
    # Force role to be creator for public registration
    user_create.role = UserRole.CREATOR
    
    try:
        user = create_user(db, user_create)
        return UserResponse.model_validate(user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account"
        )


@router.get("/", response_model=UserListResponse)
def read_users(
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of users to return"),
    search: Optional[str] = Query(None, description="Search term for username or email"),
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get all users (Admin only).
    
    This endpoint returns a paginated list of all users in the system.
    Only accessible by admin users.
    """
    result = get_users_list(
        db, 
        skip=skip, 
        limit=limit, 
        search=search, 
        role=role, 
        is_active=is_active
    )
    
    return UserListResponse(
        users=[UserResponse.model_validate(user) for user in result["users"]],
        total=result["total"],
        page=result["page"],
        size=result["size"],
        pages=result["pages"]
    )


@router.post("/", response_model=UserResponse)
def create_user_admin(
    user_create: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new user (Admin only).
    
    This endpoint allows admins to create new user accounts with any role.
    """
    try:
        user = create_user(db, user_create)
        return UserResponse.model_validate(user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account"
        )


@router.get("/me", response_model=UserProfile)
def read_user_me(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's profile.
    
    This endpoint returns the authenticated user's profile information.
    """
    return UserProfile.model_validate(current_user)


@router.put("/me", response_model=UserProfile)
def update_user_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update current user's profile.
    
    This endpoint allows users to update their own profile information.
    """
    try:
        updated_user = update_user(db, current_user.id, user_update, current_user)
        return UserProfile.model_validate(updated_user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )


@router.get("/statistics", response_model=dict)
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get user statistics (Admin only).
    
    This endpoint returns user statistics for the admin dashboard.
    """
    return get_user_statistics(db)


@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific user by ID.
    
    Users can access their own profile, admins can access any profile.
    """
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check permissions - users can only view their own profile, admins can view any
    if user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user"
        )
    
    return UserResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user_by_id(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a user.
    
    Users can update their own profile, admins can update any profile.
    """
    try:
        updated_user = update_user(db, user_id, user_update, current_user)
        return UserResponse.model_validate(updated_user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )


@router.delete("/{user_id}", response_model=MessageResponse)
def delete_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete a user (Admin only).
    
    This endpoint allows admins to delete user accounts.
    """
    try:
        delete_user(db, user_id, current_user)
        return MessageResponse(message="User deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )


@router.put("/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Deactivate a user account (Admin only).
    
    This endpoint allows admins to deactivate user accounts.
    """
    try:
        deactivated_user = deactivate_user(db, user_id, current_user)
        return UserResponse.model_validate(deactivated_user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate user"
        )


@router.put("/{user_id}/activate", response_model=UserResponse)
def activate_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Activate a user account (Admin only).
    
    This endpoint allows admins to activate user accounts.
    """
    try:
        activated_user = activate_user(db, user_id, current_user)
        return UserResponse.model_validate(activated_user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate user"
        ) 