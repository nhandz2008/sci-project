from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, create_engine

from app.core.config import settings
from app.core.security import verify_token

# We'll import these once we create the models
# from app.models.user import User
# from app.services.auth_service import get_user_by_email

# Database engine - we'll create this properly when we set up the database
# For now, this is a placeholder structure
engine = None  # Will be: create_engine(str(settings.DATABASE_URL))

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
    # We'll implement this properly when we set up the database
    # For now, this is the structure:
    
    # with Session(engine) as session:
    #     yield session
    
    # Placeholder until we set up the database
    raise NotImplementedError("Database not configured yet")


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


# We'll implement these once we have the User model and auth service
def get_current_user():
    """
    Get the current authenticated user from the database.
    
    This dependency will:
    1. Extract the JWT token
    2. Verify it's valid
    3. Look up the user in the database
    4. Return the user object
    
    This will be implemented after we create the User model.
    """
    pass


def get_current_active_user():
    """
    Get the current authenticated and active user.
    
    This adds an additional check that the user account is active.
    """
    pass


def require_admin():
    """
    Dependency that requires admin role.
    
    This will check that the current user has admin privileges.
    """
    pass


def require_creator():
    """
    Dependency that requires creator role or higher.
    
    This will check that the current user can create/edit competitions.
    """
    pass 