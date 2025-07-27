"""
Security utilities for SCI application.

This module provides password hashing and verification functions using bcrypt.
"""

from datetime import datetime, timedelta
from typing import Any, Union

import jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.models import TokenPayload

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def verify_token(token: str) -> TokenPayload:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string to verify
        
    Returns:
        TokenPayload with decoded information
        
    Raises:
        jwt.JWTError: If token is invalid or expired
    """
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        token_data = TokenPayload(**decoded_token)
        return token_data
    except jwt.InvalidTokenError as e:
        raise jwt.InvalidTokenError("Invalid token")


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