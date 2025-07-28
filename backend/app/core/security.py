"""
Security utilities for SCI application.

This module provides comprehensive security functions including:
- Password hashing and verification using bcrypt
- JWT token creation and verification
- Security constants and utilities
"""

from datetime import datetime, timedelta
from typing import Any, Union
from threading import Lock

import jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.models import TokenPayload

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security constants
ALGORITHM = "HS256"
ACCESS_TOKEN_TYPE = "access"

# Token blacklist for password reset tokens (in-memory)
# In production, this should be stored in the database
_used_password_reset_tokens: set[str] = set()
_token_blacklist_lock = Lock()

# Token blacklist for access tokens (in-memory)
# In production, this should be stored in the database
_used_access_tokens: set[str] = set()
_access_token_blacklist_lock = Lock()


def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        subject: The subject (usually user ID) to encode in the token
        expires_delta: Optional expiration time override
        
    Returns:
        Encoded JWT token string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "exp": expire, 
        "sub": str(subject),
        "type": ACCESS_TOKEN_TYPE,
        "iat": datetime.utcnow()
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = ACCESS_TOKEN_TYPE) -> TokenPayload:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string to verify
        token_type: Expected token type ("access")
        
    Returns:
        TokenPayload with decoded information
        
    Raises:
        jwt.PyJWTError: If token is invalid, expired, or wrong type
    """
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        
        # Verify token type
        if decoded_token.get("type") != token_type:
            raise jwt.InvalidTokenError(f"Invalid token type. Expected {token_type}")
        
        # Create TokenPayload with additional fields
        token_data = TokenPayload(
            sub=decoded_token.get("sub"),
            exp=decoded_token.get("exp"),
            type=decoded_token.get("type"),
            iat=decoded_token.get("iat")
        )
        return token_data
        
    except jwt.ExpiredSignatureError:
        raise jwt.ExpiredSignatureError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise jwt.InvalidTokenError(f"Invalid token: {str(e)}")


def verify_access_token(token: str) -> TokenPayload:
    """
    Verify and decode an access token.
    
    Args:
        token: JWT access token string to verify
        
    Returns:
        TokenPayload with decoded information
        
    Raises:
        jwt.PyJWTError: If token is invalid, expired, or blacklisted
    """
    # Check if token has been blacklisted (logged out)
    if is_access_token_used(token):
        raise jwt.InvalidTokenError("Token has been logged out")
    
    return verify_token(token, ACCESS_TOKEN_TYPE)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to check against
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def generate_password_reset_token(email: str) -> str:
    """
    Generate a password reset token.
    
    Args:
        email: User's email address
        
    Returns:
        Encoded JWT token for password reset
    """
    delta = timedelta(minutes=settings.EMAIL_RESET_TOKEN_EXPIRE_MINUTES)
    now = datetime.utcnow()
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email, "type": "password_reset"},
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> str | None:
    """
    Verify a password reset token and return the email.
    
    Args:
        token: Password reset token
        
    Returns:
        Email address if token is valid and unused, None otherwise
    """
    # Check if token has been used
    if is_password_reset_token_used(token):
        return None
    
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if decoded_token.get("type") != "password_reset":
            return None
        return decoded_token["sub"]
    except jwt.PyJWTError:
        return None


def is_token_expired(token: str) -> bool:
    """
    Check if a token is expired without raising an exception.
    
    Args:
        token: JWT token string
        
    Returns:
        True if token is expired, False otherwise
    """
    try:
        jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return False
    except jwt.ExpiredSignatureError:
        return True
    except jwt.PyJWTError:
        return True


def get_token_expiration(token: str) -> datetime | None:
    """
    Get the expiration time of a token.
    
    Args:
        token: JWT token string
        
    Returns:
        Expiration datetime if token is valid, None otherwise
    """
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        exp_timestamp = decoded_token.get("exp")
        if exp_timestamp:
            return datetime.fromtimestamp(exp_timestamp)
        return None
    except jwt.PyJWTError:
        return None


def add_password_reset_token_to_blacklist(token: str) -> None:
    """
    Add a password reset token to the blacklist to prevent reuse.
    
    Args:
        token: Password reset token to blacklist
    """
    with _token_blacklist_lock:
        _used_password_reset_tokens.add(token)


def is_password_reset_token_used(token: str) -> bool:
    """
    Check if a password reset token has been used.
    
    Args:
        token: Password reset token to check
        
    Returns:
        True if token has been used, False otherwise
    """
    with _token_blacklist_lock:
        return token in _used_password_reset_tokens


def add_access_token_to_blacklist(token: str) -> None:
    """
    Add an access token to the blacklist to prevent reuse after logout.
    
    Args:
        token: Access token to blacklist
    """
    with _access_token_blacklist_lock:
        _used_access_tokens.add(token)


def is_access_token_used(token: str) -> bool:
    """
    Check if an access token has been used (logged out).
    
    Args:
        token: Access token to check
        
    Returns:
        True if token has been used (logged out), False otherwise
    """
    with _access_token_blacklist_lock:
        return token in _used_access_tokens 