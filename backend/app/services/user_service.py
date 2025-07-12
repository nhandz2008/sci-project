from typing import Optional, List, Dict, Any
from sqlmodel import Session, select, func, and_, or_
from fastapi import HTTPException, status
from datetime import datetime

from app.models.user import User, UserRole
from app.core.security import verify_password, get_password_hash
from app.schemas.user import UserCreate, UserUpdate


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """
    Get user by email address.
    
    Args:
        db: Database session
        email: User's email address
        
    Returns:
        User object if found, None otherwise
    """
    statement = select(User).where(User.email == email)
    return db.exec(statement).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """
    Get user by ID.
    
    Args:
        db: Database session
        user_id: User's unique ID
        
    Returns:
        User object if found, None otherwise
    """
    return db.get(User, user_id)


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """
    Get user by username.
    
    Args:
        db: Database session
        username: User's username
        
    Returns:
        User object if found, None otherwise
    """
    statement = select(User).where(User.username == username)
    return db.exec(statement).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticate a user with email and password.
    
    Args:
        db: Database session
        email: User's email address
        password: Plain text password
        
    Returns:
        User object if authentication successful, None otherwise
    """
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_user(db: Session, user_create: UserCreate) -> User:
    """
    Create a new user account.
    
    Args:
        db: Database session
        user_create: User creation data
        
    Returns:
        Created user object
        
    Raises:
        HTTPException: If user already exists or validation fails
    """
    # Check if user already exists by email
    existing_user = get_user_by_email(db, user_create.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Check if username is already taken
    existing_username = get_user_by_username(db, user_create.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Hash the password
    hashed_password = get_password_hash(user_create.password)
    
    # Create user object
    user = User(
        email=user_create.email,
        username=user_create.username,
        hashed_password=hashed_password,
        role=user_create.role or UserRole.CREATOR,
        is_active=True
    )
    
    # Save to database
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


def get_users_list(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None
) -> Dict[str, Any]:
    """
    Get paginated list of users with filtering (Admin only).
    
    Args:
        db: Database session
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        search: Search term for username or email
        role: Filter by user role
        is_active: Filter by active status
        
    Returns:
        Dictionary containing users list and pagination info
    """
    # Build base query
    statement = select(User)
    
    # Apply filters
    conditions = []
    
    if search:
        search_term = f"%{search}%"
        conditions.append(
            or_(
                User.username.ilike(search_term),
                User.email.ilike(search_term)
            )
        )
    
    if role is not None:
        conditions.append(User.role == role)
    
    if is_active is not None:
        conditions.append(User.is_active == is_active)
    
    # Apply all conditions
    if conditions:
        statement = statement.where(and_(*conditions))
    
    # Order by creation date (newest first)
    statement = statement.order_by(User.created_at.desc())
    
    # Get total count for pagination
    count_statement = select(func.count(User.id))
    if conditions:
        count_statement = count_statement.where(and_(*conditions))
    
    total = db.exec(count_statement).first() or 0
    
    # Apply pagination
    statement = statement.offset(skip).limit(limit)
    
    users = db.exec(statement).all()
    
    # Calculate pagination info
    pages = (total + limit - 1) // limit  # Ceiling division
    
    return {
        "users": users,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "pages": pages
    }


def update_user(
    db: Session, 
    user_id: int, 
    user_update: UserUpdate, 
    current_user: User
) -> User:
    """
    Update user information.
    
    Args:
        db: Database session
        user_id: User ID to update
        user_update: Updated user data
        current_user: User performing the update
        
    Returns:
        Updated user object
        
    Raises:
        HTTPException: If user not found or unauthorized
    """
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check permissions - users can update their own profile, admins can update anyone
    if user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )
    
    # Get update data, excluding None values
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Handle password update
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    # Check for duplicate email if being updated
    if "email" in update_data and update_data["email"] != user.email:
        existing_user = get_user_by_email(db, update_data["email"])
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
    
    # Check for duplicate username if being updated
    if "username" in update_data and update_data["username"] != user.username:
        existing_user = get_user_by_username(db, update_data["username"])
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Non-admin users cannot change their role
    if "role" in update_data and current_user.role != UserRole.ADMIN:
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot change your own role"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to change user roles"
            )
    
    # Update user fields
    for field, value in update_data.items():
        setattr(user, field, value)
    
    # Update timestamp
    user.updated_at = datetime.utcnow()
    
    # Save to database
    db.commit()
    db.refresh(user)
    
    return user


def delete_user(
    db: Session, 
    user_id: int, 
    current_user: User
) -> bool:
    """
    Delete a user account (Admin only).
    
    Args:
        db: Database session
        user_id: User ID to delete
        current_user: User performing the deletion
        
    Returns:
        True if deletion successful
        
    Raises:
        HTTPException: If user not found or unauthorized
    """
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Only admin can delete users
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete users"
        )
    
    # Prevent admin from deleting themselves
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Prevent deleting the last admin
    if user.role == UserRole.ADMIN:
        admin_count = db.exec(
            select(func.count(User.id)).where(User.role == UserRole.ADMIN)
        ).first() or 0
        
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last admin account"
            )
    
    # Delete from database
    db.delete(user)
    db.commit()
    
    return True


def deactivate_user(
    db: Session, 
    user_id: int, 
    current_user: User
) -> User:
    """
    Deactivate a user account (Admin only).
    
    Args:
        db: Database session
        user_id: User ID to deactivate
        current_user: User performing the deactivation
        
    Returns:
        Updated user object
        
    Raises:
        HTTPException: If user not found or unauthorized
    """
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Only admin can deactivate users
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to deactivate users"
        )
    
    # Prevent admin from deactivating themselves
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    # Deactivate user
    user.is_active = False
    user.updated_at = datetime.utcnow()
    
    # Save to database
    db.commit()
    db.refresh(user)
    
    return user


def activate_user(
    db: Session, 
    user_id: int, 
    current_user: User
) -> User:
    """
    Activate a user account (Admin only).
    
    Args:
        db: Database session
        user_id: User ID to activate
        current_user: User performing the activation
        
    Returns:
        Updated user object
        
    Raises:
        HTTPException: If user not found or unauthorized
    """
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Only admin can activate users
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to activate users"
        )
    
    # Activate user
    user.is_active = True
    user.updated_at = datetime.utcnow()
    
    # Save to database
    db.commit()
    db.refresh(user)
    
    return user


def is_user_active(user: User) -> bool:
    """
    Check if user account is active.
    
    Args:
        user: User object
        
    Returns:
        True if user is active, False otherwise
    """
    return user.is_active


def is_user_admin(user: User) -> bool:
    """
    Check if user has admin role.
    
    Args:
        user: User object
        
    Returns:
        True if user is admin, False otherwise
    """
    return user.role == UserRole.ADMIN


def is_user_creator_or_admin(user: User) -> bool:
    """
    Check if user has creator role or higher.
    
    Args:
        user: User object
        
    Returns:
        True if user is creator or admin, False otherwise
    """
    return user.role in [UserRole.CREATOR, UserRole.ADMIN]


def get_user_statistics(db: Session) -> Dict[str, Any]:
    """
    Get user statistics for admin dashboard.
    
    Args:
        db: Database session
        
    Returns:
        Dictionary containing user statistics
    """
    total_users = db.exec(select(func.count(User.id))).first() or 0
    
    active_users = db.exec(
        select(func.count(User.id)).where(User.is_active == True)
    ).first() or 0
    
    inactive_users = total_users - active_users
    
    admin_count = db.exec(
        select(func.count(User.id)).where(User.role == UserRole.ADMIN)
    ).first() or 0
    
    creator_count = db.exec(
        select(func.count(User.id)).where(User.role == UserRole.CREATOR)
    ).first() or 0
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "admin_count": admin_count,
        "creator_count": creator_count
    } 