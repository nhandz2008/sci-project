"""
CRUD operations for SCI application.

This module provides database operations for User and Competition models.
"""

import uuid
from typing import Any, List, Optional

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    Competition,
    CompetitionCreate,
    CompetitionUpdate,
    User,
    UserCreate,
    UserUpdate,
)


# =============================================================================
# USER CRUD OPERATIONS
# =============================================================================

def create_user(*, session: Session, user_create: UserCreate) -> User:
    """
    Create a new user with hashed password.
    
    Args:
        session: Database session
        user_create: User creation data
        
    Returns:
        Created user object
    """
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_user_by_email(*, session: Session, email: str) -> Optional[User]:
    """
    Get user by email address.
    
    Args:
        session: Database session
        email: User's email address
        
    Returns:
        User object if found, None otherwise
    """
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def get_user_by_id(*, session: Session, user_id: uuid.UUID) -> Optional[User]:
    """
    Get user by ID.
    
    Args:
        session: Database session
        user_id: User's UUID
        
    Returns:
        User object if found, None otherwise
    """
    statement = select(User).where(User.id == user_id)
    session_user = session.exec(statement).first()
    return session_user


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> User:
    """
    Update user information.
    
    Args:
        session: Database session
        db_user: Existing user object
        user_in: Update data
        
    Returns:
        Updated user object
    """
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    
    # Handle password update if provided
    if "password" in user_data:
        password = user_data.pop("password")
        extra_data["hashed_password"] = get_password_hash(password)
    
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def authenticate(*, session: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticate user with email and password.
    
    Args:
        session: Database session
        email: User's email address
        password: Plain text password
        
    Returns:
        User object if authentication successful, None otherwise
    """
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def get_users(*, session: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """
    Get list of users with pagination.
    
    Args:
        session: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of user objects
    """
    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()
    return users


# =============================================================================
# COMPETITION CRUD OPERATIONS
# =============================================================================

def create_competition(*, session: Session, competition_in: CompetitionCreate, owner_id: uuid.UUID) -> Competition:
    """
    Create a new competition.
    
    Args:
        session: Database session
        competition_in: Competition creation data
        owner_id: ID of the user creating the competition
        
    Returns:
        Created competition object
    """
    db_competition = Competition.model_validate(
        competition_in, update={"owner_id": owner_id}
    )
    session.add(db_competition)
    session.commit()
    session.refresh(db_competition)
    return db_competition


def get_competition(*, session: Session, competition_id: uuid.UUID) -> Optional[Competition]:
    """
    Get competition by ID.
    
    Args:
        session: Database session
        competition_id: Competition's UUID
        
    Returns:
        Competition object if found, None otherwise
    """
    statement = select(Competition).where(Competition.id == competition_id)
    competition = session.exec(statement).first()
    return competition


def get_competitions(
    *, 
    session: Session, 
    skip: int = 0, 
    limit: int = 100,
    owner_id: Optional[uuid.UUID] = None,
    is_active: Optional[bool] = None,
    is_featured: Optional[bool] = None,
) -> List[Competition]:
    """
    Get list of competitions with optional filtering.
    
    Args:
        session: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        owner_id: Filter by owner ID
        is_active: Filter by active status
        is_featured: Filter by featured status
        
    Returns:
        List of competition objects
    """
    statement = select(Competition)
    
    # Apply filters
    if owner_id is not None:
        statement = statement.where(Competition.owner_id == owner_id)
    if is_active is not None:
        statement = statement.where(Competition.is_active == is_active)
    if is_featured is not None:
        statement = statement.where(Competition.is_featured == is_featured)
    
    # Apply pagination
    statement = statement.offset(skip).limit(limit)
    
    competitions = session.exec(statement).all()
    return competitions


def update_competition(*, session: Session, db_competition: Competition, competition_in: CompetitionUpdate) -> Competition:
    """
    Update competition information.
    
    Args:
        session: Database session
        db_competition: Existing competition object
        competition_in: Update data
        
    Returns:
        Updated competition object
    """
    competition_data = competition_in.model_dump(exclude_unset=True)
    db_competition.sqlmodel_update(competition_data)
    session.add(db_competition)
    session.commit()
    session.refresh(db_competition)
    return db_competition


def delete_competition(*, session: Session, competition_id: uuid.UUID) -> None:
    """
    Delete a competition.
    
    Args:
        session: Database session
        competition_id: Competition's UUID to delete
    """
    competition = get_competition(session=session, competition_id=competition_id)
    if competition:
        session.delete(competition)
        session.commit()


def get_competitions_by_owner(*, session: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Competition]:
    """
    Get competitions created by a specific user.
    
    Args:
        session: Database session
        owner_id: User's UUID
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of competition objects
    """
    return get_competitions(session=session, skip=skip, limit=limit, owner_id=owner_id) 