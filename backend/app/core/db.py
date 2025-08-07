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
engine = create_engine(
    str(settings.SQLALCHEMY_DATABASE_URI),
    pool_pre_ping=True,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    echo=settings.ENVIRONMENT == "local",
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_timeout=30,  # Timeout for getting connection from pool
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
