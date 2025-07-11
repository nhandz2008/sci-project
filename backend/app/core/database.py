"""
Database setup and initialization utilities.
"""

from sqlmodel import SQLModel, create_engine
from app.core.config import settings
from app.models import User, Competition  # Import all models to register them


def create_db_and_tables():
    """
    Create database tables based on SQLModel definitions.
    
    This function should be called when initializing the application
    or during database setup.
    """
    engine = create_engine(str(settings.DATABASE_URL), echo=True)
    
    # Create all tables
    SQLModel.metadata.create_all(engine)
    
    print("✅ Database tables created successfully!")


def init_db():
    """
    Initialize database with tables and initial data.
    
    This is typically called during application startup or deployment.
    """
    try:
        create_db_and_tables()
        print("✅ Database initialization completed!")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise


if __name__ == "__main__":
    # Allow running this file directly for database setup
    init_db() 