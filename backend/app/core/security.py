from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(
    subject: str | Any, expires_delta: timedelta | None = None
) -> str:
    """Create JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str) -> str | None:
    """Verify JWT token and return subject (user ID as string)."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        subject: str = payload.get("sub")
        exp: int = payload.get("exp")

        if subject is None:
            return None

        # Check if token is expired
        if exp is None or datetime.now(timezone.utc).timestamp() > exp:
            return None

        return subject
    except JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash password."""
    return pwd_context.hash(password)


def create_refresh_token(
    subject: str | Any, expires_delta: timedelta | None = None
) -> str:
    """Create JWT refresh token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_refresh_token(token: str) -> str | None:
    """Verify JWT refresh token and return subject."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        subject: str = payload.get("sub")
        token_type: str = payload.get("type")
        if subject is None or token_type != "refresh":
            return None
        return subject
    except JWTError:
        return None


def validate_password_strength(password: str) -> tuple[bool, str | None]:
    """Validate password strength and return (is_valid, error_message)."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    return True, None


def validate_password(password: str) -> bool:
    """Validate password strength."""
    is_valid, _ = validate_password_strength(password)
    return is_valid


def create_password_reset_token(
    email: str, expires_delta: timedelta | None = None
) -> str:
    """Create password reset token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=30)  # 30 minutes
    to_encode = {"exp": expire, "sub": email, "type": "password_reset"}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> str | None:
    """Verify password reset token and return email."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        exp: int = payload.get("exp")

        if email is None or token_type != "password_reset":
            return None

        # Check if token is expired
        if exp is None or datetime.now(timezone.utc).timestamp() > exp:
            return None

        return email
    except JWTError:
        return None
