"""User CRUD operations."""

from uuid import UUID

from sqlalchemy import text
from sqlmodel import Session, select

from app.core.db import get_session, get_search_operator
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    DatabaseError,
    DuplicateUserError,
    UserNotFoundError,
)
from app.core.security import get_password_hash, verify_password
from app.models.common import UserRole
from app.models.user import User
from app.schemas.auth import UserCreate
from app.schemas.user import UserUpdate
from app.core.config import settings


def create_user(session: Session, user_create: UserCreate) -> User:
    """Create a new user."""
    try:
        # Check if user with email already exists
        existing_user = get_user_by_email(session, user_create.email)
        if existing_user:
            raise DuplicateUserError(
                message="User with this email already exists",
                error_code="USER_004",
                details=f"Email {user_create.email} is already registered",
            )

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
    except DuplicateUserError:
        raise
    except Exception as e:
        session.rollback()
        raise DatabaseError(
            message="Failed to create user",
            error_code="DB_002",
            details=f"Database error: {str(e)}",
        )


def get_user_by_email(session: Session, email: str) -> User | None:
    """Get user by email."""
    try:
        statement = select(User).where(User.email == email)
        return session.exec(statement).first()
    except Exception as e:
        raise DatabaseError(
            message="Failed to retrieve user by email",
            error_code="DB_003",
            details=f"Database error: {str(e)}",
        )


def get_user_by_id(session: Session, user_id: UUID) -> User | None:
    """Get user by ID."""
    try:
        statement = select(User).where(User.id == user_id)
        return session.exec(statement).first()
    except Exception as e:
        raise DatabaseError(
            message="Failed to retrieve user by ID",
            error_code="DB_004",
            details=f"Database error: {str(e)}",
        )


def update_user(session: Session, user: User, user_update: UserUpdate) -> User:
    """Update user profile."""
    try:
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
    except Exception as e:
        session.rollback()
        raise DatabaseError(
            message="Failed to update user",
            error_code="DB_005",
            details=f"Database error: {str(e)}",
        )


def update_user_password(session: Session, user: User, new_password: str) -> User:
    """Update user password."""
    try:
        hashed_password = get_password_hash(new_password)
        user.hashed_password = hashed_password

        session.add(user)
        session.commit()
        session.refresh(user)

        return user
    except Exception as e:
        session.rollback()
        raise DatabaseError(
            message="Failed to update user password",
            error_code="DB_006",
            details=f"Database error: {str(e)}",
        )


def authenticate_user(session: Session, email: str, password: str) -> User | None:
    """Authenticate user with email and password."""
    try:
        user = get_user_by_email(session, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user
    except DatabaseError:
        raise
    except Exception as e:
        raise DatabaseError(
            message="Failed to authenticate user",
            error_code="DB_007",
            details=f"Authentication error: {str(e)}",
        )


def get_users(
    session: Session,
    skip: int = 0,
    limit: int = 100,
    role: UserRole | None = None,
    is_active: bool | None = None,
    search: str | None = None,
) -> tuple[list[User], int]:
    """Get users with pagination and filtering."""
    try:
        # Build query
        query = select(User)

        # Add filters
        if role is not None:
            query = query.where(User.role == role)
        if is_active is not None:
            query = query.where(User.is_active == is_active)
        if search:
            search_term = f"%{search}%"
            search_op = get_search_operator()
            if settings.ENVIRONMENT == "test":
                # SQLite uses LIKE with COLLATE NOCASE
                query = query.where(
                    text(f"full_name LIKE :search COLLATE NOCASE OR email LIKE :search COLLATE NOCASE").bindparams(
                        search=search_term
                    )
                )
            else:
                # PostgreSQL uses ILIKE
                query = query.where(
                    text(f"full_name {search_op} :search OR email {search_op} :search").bindparams(
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
    except Exception as e:
        raise DatabaseError(
            message="Failed to retrieve users",
            error_code="DB_008",
            details=f"Database error: {str(e)}",
        )


def delete_user(session: Session, user_id: UUID) -> bool:
    """Delete user by ID."""
    try:
        user = get_user_by_id(session, user_id)
        if not user:
            raise UserNotFoundError(
                message="User not found",
                error_code="USER_005",
                details=f"User with ID {user_id} does not exist",
            )

        session.delete(user)
        session.commit()
        return True
    except UserNotFoundError:
        raise
    except Exception as e:
        session.rollback()
        raise DatabaseError(
            message="Failed to delete user",
            error_code="DB_009",
            details=f"Database error: {str(e)}",
        )


def deactivate_user(session: Session, user_id: UUID) -> bool:
    """Deactivate user by ID."""
    try:
        user = get_user_by_id(session, user_id)
        if not user:
            raise UserNotFoundError(
                message="User not found",
                error_code="USER_006",
                details=f"User with ID {user_id} does not exist",
            )

        user.is_active = False
        session.add(user)
        session.commit()
        return True
    except UserNotFoundError:
        raise
    except Exception as e:
        session.rollback()
        raise DatabaseError(
            message="Failed to deactivate user",
            error_code="DB_010",
            details=f"Database error: {str(e)}",
        )


def activate_user(session: Session, user_id: UUID) -> bool:
    """Activate user by ID."""
    try:
        user = get_user_by_id(session, user_id)
        if not user:
            raise UserNotFoundError(
                message="User not found",
                error_code="USER_007",
                details=f"User with ID {user_id} does not exist",
            )

        user.is_active = True
        session.add(user)
        session.commit()
        return True
    except UserNotFoundError:
        raise
    except Exception as e:
        session.rollback()
        raise DatabaseError(
            message="Failed to activate user",
            error_code="DB_011",
            details=f"Database error: {str(e)}",
        )


def change_user_role(session: Session, user_id: UUID, new_role: UserRole) -> bool:
    """Change user role."""
    try:
        user = get_user_by_id(session, user_id)
        if not user:
            raise UserNotFoundError(
                message="User not found",
                error_code="USER_008",
                details=f"User with ID {user_id} does not exist",
            )

        user.role = new_role
        session.add(user)
        session.commit()
        return True
    except UserNotFoundError:
        raise
    except Exception as e:
        session.rollback()
        raise DatabaseError(
            message="Failed to change user role",
            error_code="DB_012",
            details=f"Database error: {str(e)}",
        )


# Additional utility functions for enhanced CRUD operations


def get_user_count(
    session: Session, role: UserRole | None = None, is_active: bool | None = None
) -> int:
    """Get total count of users with optional filtering."""
    try:
        query = select(User)

        if role is not None:
            query = query.where(User.role == role)
        if is_active is not None:
            query = query.where(User.is_active == is_active)

        count_query = select(text("COUNT(*)")).select_from(query.subquery())
        return session.exec(count_query).first() or 0
    except Exception as e:
        raise DatabaseError(
            message="Failed to get user count",
            error_code="DB_016",
            details=f"Database error: {str(e)}",
        )


def get_users_by_role(
    session: Session, role: UserRole, skip: int = 0, limit: int = 100
) -> tuple[list[User], int]:
    """Get users by specific role with pagination."""
    return get_users(session, skip=skip, limit=limit, role=role)


def get_active_users(
    session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[User], int]:
    """Get active users with pagination."""
    return get_users(session, skip=skip, limit=limit, is_active=True)


def get_inactive_users(
    session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[User], int]:
    """Get inactive users with pagination."""
    return get_users(session, skip=skip, limit=limit, is_active=False)


def bulk_activate_users(session: Session, user_ids: list[UUID]) -> int:
    """Bulk activate multiple users."""
    try:
        activated_count = 0
        for user_id in user_ids:
            try:
                if activate_user(session, user_id):
                    activated_count += 1
            except UserNotFoundError:
                # Skip users that don't exist
                continue
        return activated_count
    except Exception as e:
        session.rollback()
        raise DatabaseError(
            message="Failed to bulk activate users",
            error_code="DB_017",
            details=f"Database error: {str(e)}",
        )


def bulk_deactivate_users(session: Session, user_ids: list[UUID]) -> int:
    """Bulk deactivate multiple users."""
    try:
        deactivated_count = 0
        for user_id in user_ids:
            try:
                if deactivate_user(session, user_id):
                    deactivated_count += 1
            except UserNotFoundError:
                # Skip users that don't exist
                continue
        return deactivated_count
    except Exception as e:
        session.rollback()
        raise DatabaseError(
            message="Failed to bulk deactivate users",
            error_code="DB_018",
            details=f"Database error: {str(e)}",
        )


def search_users_by_name(
    session: Session, name: str, skip: int = 0, limit: int = 100
) -> tuple[list[User], int]:
    """Search users by name with pagination."""
    try:
        query = select(User)
        search_term = f"%{name}%"
        search_op = get_search_operator()
        
        if settings.ENVIRONMENT == "test":
            # SQLite uses LIKE with COLLATE NOCASE
            query = query.where(
                text(f"full_name LIKE :search COLLATE NOCASE").bindparams(search=search_term)
            )
        else:
            # PostgreSQL uses ILIKE
            query = query.where(
                text(f"full_name {search_op} :search").bindparams(search=search_term)
            )

        # Get total count
        count_query = select(text("COUNT(*)")).select_from(query.subquery())
        total = session.exec(count_query).first() or 0

        # Add pagination
        query = query.offset(skip).limit(limit)

        # Execute query
        users = session.exec(query).all()

        return users, total
    except Exception as e:
        raise DatabaseError(
            message="Failed to search users by name",
            error_code="DB_019",
            details=f"Database error: {str(e)}",
        )


def get_user_statistics(session: Session) -> dict:
    """Get user statistics."""
    try:
        total_users = get_user_count(session)
        active_users = get_user_count(session, is_active=True)
        inactive_users = get_user_count(session, is_active=False)
        admin_users = get_user_count(session, role=UserRole.ADMIN)
        creator_users = get_user_count(session, role=UserRole.CREATOR)

        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": inactive_users,
            "admin_users": admin_users,
            "creator_users": creator_users,
            "active_percentage": round(
                (active_users / total_users * 100) if total_users > 0 else 0, 2
            ),
        }
    except Exception as e:
        raise DatabaseError(
            message="Failed to get user statistics",
            error_code="DB_020",
            details=f"Database error: {str(e)}",
        )
