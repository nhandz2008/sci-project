from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, create_engine

from app.core.config import settings
from app.core.security import verify_token
from app.models.user import User, UserRole
from app.services.user_service import get_user_by_email, is_user_active, is_user_admin, is_user_creator_or_admin

# Database engine setup
engine = create_engine(
    str(settings.DATABASE_URL),
    echo=False,  # Set to True for SQL query logging in development
    pool_pre_ping=True,  # Verify connections before use
)

# Security scheme for JWT tokens
security = HTTPBearer()


def get_db() -> Generator[Session, None, None]:
    """
    Database dependency for FastAPI routes.
    
    This creates a database session for each request and ensures it's properly closed.
    This is a key pattern in FastAPI for database access.
    
    Yields:
        Database session
    """
    with Session(engine) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()


def get_current_user_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Extract and verify the current user's JWT token.
    
    This dependency can be used in routes that require authentication.
    
    Args:
        credentials: HTTP Bearer token from the Authorization header
        
    Returns:
        Decoded token payload containing user information
        
    Raises:
        HTTPException: If token is missing or invalid
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    return verify_token(token)


def get_current_user(
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_current_user_token)
) -> User:
    """
    Get the current authenticated user from the database.
    
    This dependency:
    1. Extracts and verifies the JWT token
    2. Looks up the user in the database
    3. Returns the user object
    
    Args:
        db: Database session
        token_data: Verified token payload containing user email
        
    Returns:
        Current authenticated user
        
    Raises:
        HTTPException: If user not found or token invalid
    """
    email = token_data.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain user email",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get the current authenticated and active user.
    
    This adds an additional check that the user account is active.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Current active user
        
    Raises:
        HTTPException: If user account is inactive
    """
    if not is_user_active(current_user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    return current_user


def require_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependency that requires admin role.
    
    This checks that the current user has admin privileges.
    
    Args:
        current_user: Current active user
        
    Returns:
        Current user (confirmed to be admin)
        
    Raises:
        HTTPException: If user does not have admin role
    """
    if not is_user_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required"
        )
    
    return current_user


def require_creator(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependency that requires creator role or higher.
    
    This checks that the current user can create/edit competitions.
    
    Args:
        current_user: Current active user
        
    Returns:
        Current user (confirmed to be creator or admin)
        
    Raises:
        HTTPException: If user does not have creator or admin role
    """
    if not is_user_creator_or_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creator or administrator privileges required"
        )
    
    return current_user 