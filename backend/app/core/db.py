"""Database session management."""

import logging
from collections.abc import Generator
from contextlib import contextmanager

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings
from app.core.exceptions import DatabaseError

# Configure logging
logger = logging.getLogger(__name__)


# Create database engine with enhanced configuration
def get_database_url() -> str:
    """Get database URL based on environment (always PostgreSQL driver).

    Uses TEST_POSTGRES_DB for tests when provided; otherwise falls back to main DB.
    """
    return str(settings.SQLALCHEMY_DATABASE_URI)


def get_search_operator() -> str:
    """Return case-insensitive search operator for PostgreSQL."""
    return "ILIKE"


engine = create_engine(
    get_database_url(),
    pool_pre_ping=True,
    echo=settings.DATABASE_ECHO,
)


def create_db_and_tables() -> None:
    """Create database tables."""
    try:
        SQLModel.metadata.create_all(engine)
        logger.info("✅ Database tables created successfully")
    except Exception as e:
        logger.error(f"❌ Failed to create database tables: {e}")
        raise DatabaseError(
            message="Failed to create database tables",
            error_code="DB_013",
            details=f"Database initialization error: {str(e)}",
        )


def get_session() -> Generator[Session, None, None]:
    """Get database session with proper error handling."""
    session = Session(engine)
    try:
        yield session
    except Exception as e:
        logger.error(f"❌ Database session error: {e}")
        session.rollback()
        # Let custom exceptions pass through
        if hasattr(e, "error_code") and e.error_code.startswith(
            ("USER_", "AUTH_", "COMP_")
        ):
            raise
        # Let HTTPExceptions pass through
        if hasattr(e, "status_code"):
            raise
        # Only convert database-related errors to DatabaseError
        raise DatabaseError(
            message="Database session error",
            error_code="DB_014",
            details=f"Session error: {str(e)}",
        )
    finally:
        session.close()


@contextmanager
def get_session_context() -> Generator[Session, None, None]:
    """Get database session as context manager for manual control."""
    session = Session(engine)
    try:
        yield session
        session.commit()
    except Exception as e:
        logger.error(f"❌ Database session error: {e}")
        session.rollback()
        raise DatabaseError(
            message="Database session error",
            error_code="DB_015",
            details=f"Session error: {str(e)}",
        )
    finally:
        session.close()


def test_database_connection() -> bool:
    """Test database connection."""
    try:
        with Session(engine) as session:
            session.exec("SELECT 1").first()
        logger.info("✅ Database connection test successful")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection test failed: {e}")
        return False


def get_database_info() -> dict:
    """Get database connection information."""
    return {
        "pool_size": settings.DATABASE_POOL_SIZE,
        "max_overflow": settings.DATABASE_MAX_OVERFLOW,
        "pool_recycle": 3600,
        "pool_timeout": 30,
        "echo": settings.ENVIRONMENT == "local",
    }
