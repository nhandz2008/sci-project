"""Test configuration and fixtures."""

import os
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy import text

from app.main import app
from app.core.config import settings

# Set test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["POSTGRES_PASSWORD"] = "test-password"
os.environ["FIRST_SUPERUSER_PASSWORD"] = "test-admin-password"

# Test database URL - use SQLite for testing
TEST_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)


@pytest.fixture(scope="function")
def test_db():
    """Create test database tables."""
    SQLModel.metadata.create_all(test_engine)
    yield
    SQLModel.metadata.drop_all(test_engine)


@pytest.fixture(autouse=True)
def clean_db(test_db):
    """Clean database between tests."""
    yield
    # Clean up all tables after each test
    with Session(test_engine) as session:
        # Delete all data from all tables in reverse dependency order
        session.exec(text("DELETE FROM competitions"))
        session.exec(text("DELETE FROM users"))
        # Reset SQLite auto-increment counters if they exist
        try:
            session.exec(text("DELETE FROM sqlite_sequence WHERE name='competitions'"))
            session.exec(text("DELETE FROM sqlite_sequence WHERE name='users'"))
        except:
            # sqlite_sequence table might not exist, ignore the error
            pass
        session.commit()


@pytest.fixture
def session(test_db):
    """Create test database session."""
    with Session(test_engine) as session:
        yield session


@pytest.fixture
def client(session):
    """Create test client."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_headers(client, session):
    """Create authenticated user and return headers."""
    # Create user
    user_data = {
        "email": "test@example.com",
        "full_name": "Test User",
        "organization": "Test Org",
        "phone_number": "+1234567890",
        "password": "TestPass123"
    }
    
    # Register user
    response = client.post("/api/v1/auth/signup", json=user_data)
    assert response.status_code == 200
    
    # Login to get token
    login_data = {
        "email": "test@example.com",
        "password": "TestPass123"
    }
    login_response = client.post("/api/v1/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    return headers


@pytest.fixture
def admin_headers(client, session):
    """Create authenticated admin user and return headers."""
    # Create admin user directly in database
    from app.crud.user import create_user
    from app.schemas.auth import UserCreate
    from app.models.common import UserRole
    
    admin_data = {
        "email": "admin@example.com",
        "full_name": "Admin User",
        "organization": "Admin Org",
        "phone_number": "+1234567890",
        "password": "AdminPass123"
    }
    
    user_create = UserCreate(**admin_data)
    user = create_user(session, user_create)
    user.role = UserRole.ADMIN
    session.add(user)
    session.commit()
    
    # Login to get token
    login_data = {
        "email": "admin@example.com",
        "password": "AdminPass123"
    }
    login_response = client.post("/api/v1/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    return headers 