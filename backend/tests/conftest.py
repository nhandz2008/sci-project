"""Test configuration and fixtures (PostgreSQL-backed)."""

import os
import time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlmodel import Session, create_engine

# Set test environment (PostgreSQL only) BEFORE importing app/settings
os.environ["ENVIRONMENT"] = "test"
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only")
os.environ.setdefault("POSTGRES_PASSWORD", "changethis")
os.environ.setdefault("POSTGRES_USER", "postgres")
os.environ.setdefault("POSTGRES_SERVER", "localhost")
os.environ.setdefault("POSTGRES_DB", "sci_db")
os.environ.setdefault("TEST_POSTGRES_DB", "sci_test_db")
os.environ.setdefault("FIRST_SUPERUSER_PASSWORD", "test-admin-password")

from app.core.config import settings  # noqa: E402
from app.core.db import get_session  # noqa: E402
from app.main import app  # noqa: E402


def _wait_for_db_ready(max_wait_seconds: int = 30) -> None:
    """Wait until the Postgres database is ready to accept connections."""
    start = time.time()
    last_error: Exception | None = None
    while time.time() - start < max_wait_seconds:
        try:
            engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                return
        except Exception as exc:  # pragma: no cover - retry loop
            last_error = exc
            time.sleep(1)
    raise RuntimeError(f"Database not ready after {max_wait_seconds}s: {last_error}")


# Create test engine against Postgres (uses TEST_POSTGRES_DB)
_wait_for_db_ready()
test_engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI), echo=False)


@pytest.fixture(scope="session", autouse=True)
def create_test_schema():
    """Ensure schema via Alembic for correct types (UUID, enums)."""
    import subprocess
    import sys

    env = os.environ.copy()
    env.update(
        {
            "ENVIRONMENT": "test",
            "TEST_POSTGRES_DB": os.environ.get("TEST_POSTGRES_DB", "sci_test_db"),
            "POSTGRES_SERVER": os.environ.get("POSTGRES_SERVER", "localhost"),
            "POSTGRES_USER": os.environ.get("POSTGRES_USER", "postgres"),
            "POSTGRES_PASSWORD": os.environ.get("POSTGRES_PASSWORD", "changethis"),
            "POSTGRES_DB": os.environ.get("TEST_POSTGRES_DB", "sci_test_db"),
        }
    )

    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        check=True,
        cwd=os.path.dirname(os.path.dirname(__file__)),
        env=env,
    )

    yield

    subprocess.run(
        [sys.executable, "-m", "alembic", "downgrade", "base"],
        check=True,
        cwd=os.path.dirname(os.path.dirname(__file__)),
        env=env,
    )


@pytest.fixture(autouse=True)
def clean_db():
    """Clean database between tests (truncate tables)."""
    yield
    with Session(test_engine) as session:
        # Order matters: child tables before parent tables
        session.exec(text("DELETE FROM competitions"))
        session.exec(text("DELETE FROM users"))
        session.commit()


@pytest.fixture
def session():
    """Create test database session."""
    with Session(test_engine) as session_obj:
        yield session_obj


@pytest.fixture
def client():
    """Create test client and override DB dependency to use test engine."""

    def _get_test_session():
        with Session(test_engine) as s:
            yield s

    # Override app dependency
    app.dependency_overrides[get_session] = _get_test_session

    with TestClient(app) as test_client:
        yield test_client

    # Cleanup overrides
    app.dependency_overrides.pop(get_session, None)


@pytest.fixture
def auth_headers(client):
    """Create authenticated user and return headers."""
    # Create user
    user_data = {
        "email": "test@example.com",
        "full_name": "Test User",
        "organization": "Test Org",
        "phone_number": "+1234567890",
        "password": "TestPass123",
    }

    # Register user
    response = client.post("/api/v1/auth/signup", json=user_data)
    assert response.status_code == 200

    # Login to get token
    login_data = {"email": "test@example.com", "password": "TestPass123"}
    login_response = client.post("/api/v1/auth/login", json=login_data)
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    return headers


@pytest.fixture
def admin_headers(client):
    """Create authenticated admin user and return headers."""
    # Create admin user directly in database
    from app.crud.user import create_user
    from app.models.common import UserRole
    from app.schemas.auth import UserCreate

    admin_data = {
        "email": "admin@example.com",
        "full_name": "Admin User",
        "organization": "Admin Org",
        "phone_number": "+1234567890",
        "password": "AdminPass123",
    }

    user_create = UserCreate(**admin_data)
    user = create_user(session, user_create)
    user.role = UserRole.ADMIN
    session.add(user)
    session.commit()

    # Login to get token
    login_data = {"email": "admin@example.com", "password": "AdminPass123"}
    login_response = client.post("/api/v1/auth/login", json=login_data)
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    return headers
