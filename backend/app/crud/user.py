"""User CRUD operations."""

from uuid import UUID

from sqlalchemy import text
from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models.common import UserRole
from app.models.user import User
from app.schemas.auth import UserCreate
from app.schemas.user import UserUpdate


def create_user(session: Session, user_create: UserCreate) -> User:
    """Create a new user."""
    # Check if user with email already exists
    existing_user = get_user_by_email(session, user_create.email)
    if existing_user:
        raise ValueError("User with this email already exists")

    # Hash password
    hashed_password = get_password_hash(user_create.password)

    # Create user object
    user = User(
        email=user_create.email,
        full_name=user_create.full_name,
        organization=user_create.organization,
        phone_number=user_create.phone_number,
        hashed_password=hashed_password,
        role=UserRole.CREATOR,  # Default role
        is_active=True,
    )

    # Add to database
    session.add(user)
    session.commit()
    session.refresh(user)

    return user


def get_user_by_email(session: Session, email: str) -> User | None:
    """Get user by email."""
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()


def get_user_by_id(session: Session, user_id: UUID) -> User | None:
    """Get user by ID."""
    statement = select(User).where(User.id == user_id)
    return session.exec(statement).first()


def update_user(session: Session, user: User, user_update: UserUpdate) -> User:
    """Update user profile."""
    # Update only provided fields
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.organization is not None:
        user.organization = user_update.organization
    if user_update.phone_number is not None:
        user.phone_number = user_update.phone_number

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


def update_user_password(session: Session, user: User, new_password: str) -> User:
    """Update user password."""
    hashed_password = get_password_hash(new_password)
    user.hashed_password = hashed_password

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


def authenticate_user(session: Session, email: str, password: str) -> User | None:
    """Authenticate user with email and password."""
    user = get_user_by_email(session, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user


def get_users(
    session: Session,
    skip: int = 0,
    limit: int = 100,
    role: UserRole | None = None,
    is_active: bool | None = None,
    search: str | None = None,
) -> tuple[list[User], int]:
    """Get users with pagination and filtering."""
    # Build query
    query = select(User)

    # Add filters
    if role is not None:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            text("full_name ILIKE :search OR email ILIKE :search").bindparams(
                search=search_term
            )
        )

    # Get total count
    count_query = select(text("COUNT(*)")).select_from(query.subquery())
    total = session.exec(count_query).first() or 0

    # Add pagination
    query = query.offset(skip).limit(limit)

    # Execute query
    users = session.exec(query).all()

    return users, total


def delete_user(session: Session, user_id: UUID) -> bool:
    """Delete user by ID."""
    user = get_user_by_id(session, user_id)
    if not user:
        return False

    session.delete(user)
    session.commit()
    return True


def deactivate_user(session: Session, user_id: UUID) -> bool:
    """Deactivate user by ID."""
    user = get_user_by_id(session, user_id)
    if not user:
        return False

    user.is_active = False
    session.add(user)
    session.commit()
    return True


def activate_user(session: Session, user_id: UUID) -> bool:
    """Activate user by ID."""
    user = get_user_by_id(session, user_id)
    if not user:
        return False

    user.is_active = True
    session.add(user)
    session.commit()
    return True


def change_user_role(session: Session, user_id: UUID, new_role: UserRole) -> bool:
    """Change user role."""
    user = get_user_by_id(session, user_id)
    if not user:
        return False

    user.role = new_role
    session.add(user)
    session.commit()
    return True
