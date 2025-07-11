from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from app.schemas.user import UserLogin, UserResponse, UserLoginResponse
from app.schemas.common import MessageResponse
from app.services.auth_service import login_user
from app.core.deps import get_db, get_current_active_user
from app.models.user import User

router = APIRouter()


@router.post("/login", response_model=UserLoginResponse)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    User login endpoint using OAuth2 password flow.
    
    Args:
        form_data: OAuth2 form data containing username (email) and password
        db: Database session
        
    Returns:
        Access token and user information
        
    Raises:
        HTTPException: If authentication fails
    """
    try:
        # OAuth2PasswordRequestForm uses 'username' field, but we accept email
        login_data = login_user(db, form_data.username, form_data.password)
        return UserLoginResponse(**login_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error"
        )


@router.post("/logout", response_model=MessageResponse)
def logout(
    current_user: User = Depends(get_current_active_user)
):
    """
    User logout endpoint.
    
    Since JWT tokens are stateless, logout is primarily handled client-side
    by removing the token. This endpoint confirms the user was authenticated
    and can be used for logging purposes.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Success message
    """
    # In a production system, you might want to:
    # 1. Add token to a blacklist/Redis cache
    # 2. Log the logout event
    # 3. Revoke refresh tokens if using them
    
    return MessageResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
def read_users_me(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current authenticated user information.
    
    This endpoint returns the current authenticated user's profile.
    Requires a valid JWT token in the Authorization header.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User profile information
    """
    return UserResponse.model_validate(current_user) 