from typing import Optional
from sqlmodel import Session, select
from app.models.user import User
from app.core.security import verify_password


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


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
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
    from app.models.user import UserRole
    return user.role == UserRole.ADMIN


def is_user_creator_or_admin(user: User) -> bool:
    """
    Check if user has creator role or higher.
    
    Args:
        user: User object
        
    Returns:
        True if user is creator or admin, False otherwise
    """
    from app.models.user import UserRole
    return user.role in [UserRole.CREATOR, UserRole.ADMIN] 