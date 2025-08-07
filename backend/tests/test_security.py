"""Tests for security utilities."""

import pytest
from datetime import datetime, timedelta
from uuid import uuid4

from app.core.security import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    get_password_hash,
    validate_password,
    validate_password_strength,
    verify_password,
    verify_password_reset_token,
    verify_refresh_token,
    verify_token,
)


class TestPasswordHashing:
    """Test password hashing functionality."""

    def test_get_password_hash(self):
        """Test password hashing."""
        password = "TestPassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert len(hashed) > len(password)
        assert hashed.startswith("$2b$")

    def test_verify_password_success(self):
        """Test successful password verification."""
        password = "TestPassword123"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True

    def test_verify_password_failure(self):
        """Test failed password verification."""
        password = "TestPassword123"
        wrong_password = "WrongPassword123"
        hashed = get_password_hash(password)
        
        assert verify_password(wrong_password, hashed) is False

    def test_verify_password_empty(self):
        """Test password verification with empty password."""
        password = ""
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True

    def test_verify_password_special_chars(self):
        """Test password verification with special characters."""
        password = "Test@Password#123!"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True


class TestPasswordValidation:
    """Test password validation functionality."""

    def test_validate_password_success(self):
        """Test successful password validation."""
        password = "ValidPass123"
        
        assert validate_password(password) is True

    def test_validate_password_too_short(self):
        """Test password validation with too short password."""
        password = "Short1"
        
        assert validate_password(password) is False

    def test_validate_password_no_uppercase(self):
        """Test password validation without uppercase letter."""
        password = "validpass123"
        
        assert validate_password(password) is False

    def test_validate_password_no_lowercase(self):
        """Test password validation without lowercase letter."""
        password = "VALIDPASS123"
        
        assert validate_password(password) is False

    def test_validate_password_no_digit(self):
        """Test password validation without digit."""
        password = "ValidPass"
        
        assert validate_password(password) is False

    def test_validate_password_strength_success(self):
        """Test password strength validation success."""
        password = "ValidPass123"
        
        is_valid, error_message = validate_password_strength(password)
        
        assert is_valid is True
        assert error_message is None

    def test_validate_password_strength_too_short(self):
        """Test password strength validation with too short password."""
        password = "Short1"
        
        is_valid, error_message = validate_password_strength(password)
        
        assert is_valid is False
        assert "at least 8 characters" in error_message

    def test_validate_password_strength_no_uppercase(self):
        """Test password strength validation without uppercase."""
        password = "validpass123"
        
        is_valid, error_message = validate_password_strength(password)
        
        assert is_valid is False
        assert "uppercase letter" in error_message

    def test_validate_password_strength_no_lowercase(self):
        """Test password strength validation without lowercase."""
        password = "VALIDPASS123"
        
        is_valid, error_message = validate_password_strength(password)
        
        assert is_valid is False
        assert "lowercase letter" in error_message

    def test_validate_password_strength_no_digit(self):
        """Test password strength validation without digit."""
        password = "ValidPass"
        
        is_valid, error_message = validate_password_strength(password)
        
        assert is_valid is False
        assert "digit" in error_message


class TestJWTTokens:
    """Test JWT token functionality."""

    def test_create_access_token(self):
        """Test access token creation."""
        user_id = str(uuid4())
        token = create_access_token(user_id)
        
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_access_token_with_expiry(self):
        """Test access token creation with custom expiry."""
        user_id = str(uuid4())
        expiry = timedelta(minutes=30)
        token = create_access_token(user_id, expires_delta=expiry)
        
        assert isinstance(token, str)
        assert len(token) > 0

    def test_verify_token_success(self):
        """Test successful token verification."""
        user_id = str(uuid4())
        token = create_access_token(user_id)
        
        verified_user_id = verify_token(token)
        
        assert verified_user_id == user_id

    def test_verify_token_invalid(self):
        """Test token verification with invalid token."""
        invalid_token = "invalid.token.here"
        
        verified_user_id = verify_token(invalid_token)
        
        assert verified_user_id is None

    def test_verify_token_expired(self):
        """Test token verification with expired token."""
        user_id = str(uuid4())
        # Create token with very short expiry
        expiry = timedelta(seconds=1)
        token = create_access_token(user_id, expires_delta=expiry)
        
        # Wait for token to expire
        import time
        time.sleep(2)
        
        verified_user_id = verify_token(token)
        
        assert verified_user_id is None

    def test_create_refresh_token(self):
        """Test refresh token creation."""
        user_id = str(uuid4())
        token = create_refresh_token(user_id)
        
        assert isinstance(token, str)
        assert len(token) > 0

    def test_verify_refresh_token_success(self):
        """Test successful refresh token verification."""
        user_id = str(uuid4())
        token = create_refresh_token(user_id)
        
        verified_user_id = verify_refresh_token(token)
        
        assert verified_user_id == user_id

    def test_verify_refresh_token_invalid(self):
        """Test refresh token verification with invalid token."""
        invalid_token = "invalid.token.here"
        
        verified_user_id = verify_refresh_token(invalid_token)
        
        assert verified_user_id is None

    def test_verify_refresh_token_wrong_type(self):
        """Test refresh token verification with access token."""
        user_id = str(uuid4())
        access_token = create_access_token(user_id)
        
        verified_user_id = verify_refresh_token(access_token)
        
        assert verified_user_id is None


class TestPasswordResetTokens:
    """Test password reset token functionality."""

    def test_create_password_reset_token(self):
        """Test password reset token creation."""
        email = "test@example.com"
        token = create_password_reset_token(email)
        
        assert isinstance(token, str)
        assert len(token) > 0

    def test_verify_password_reset_token_success(self):
        """Test successful password reset token verification."""
        email = "test@example.com"
        token = create_password_reset_token(email)
        
        verified_email = verify_password_reset_token(token)
        
        assert verified_email == email

    def test_verify_password_reset_token_invalid(self):
        """Test password reset token verification with invalid token."""
        invalid_token = "invalid.token.here"
        
        verified_email = verify_password_reset_token(invalid_token)
        
        assert verified_email is None

    def test_verify_password_reset_token_wrong_type(self):
        """Test password reset token verification with access token."""
        user_id = str(uuid4())
        access_token = create_access_token(user_id)
        
        verified_email = verify_password_reset_token(access_token)
        
        assert verified_email is None

    def test_verify_password_reset_token_expired(self):
        """Test password reset token expiration."""
        email = "test@example.com"
        
        # Create token with 1 second expiry
        from datetime import timedelta
        token = create_password_reset_token(email, expires_delta=timedelta(seconds=1))
        
        # Wait for token to expire
        import time
        time.sleep(2)
        
        verified_email = verify_password_reset_token(token)
        
        assert verified_email is None


class TestTokenSecurity:
    """Test token security aspects."""

    def test_tokens_are_different(self):
        """Test that different token types produce different tokens."""
        user_id = str(uuid4())
        email = "test@example.com"
        
        access_token = create_access_token(user_id)
        refresh_token = create_refresh_token(user_id)
        reset_token = create_password_reset_token(email)
        
        assert access_token != refresh_token
        assert access_token != reset_token
        assert refresh_token != reset_token

    def test_same_user_different_tokens(self):
        """Test that same user gets different tokens."""
        user_id = str(uuid4())
        
        token1 = create_access_token(user_id)
        
        # Add a longer delay to ensure different timestamps
        import time
        time.sleep(1)  # 1 second delay
        
        token2 = create_access_token(user_id)
        
        # Tokens should be different due to different creation times
        assert token1 != token2

    def test_token_verification_consistency(self):
        """Test that token verification is consistent."""
        user_id = str(uuid4())
        token = create_access_token(user_id)
        
        # Verify multiple times
        for _ in range(5):
            verified_user_id = verify_token(token)
            assert verified_user_id == user_id

    def test_token_with_special_characters(self):
        """Test token creation and verification with special characters in subject."""
        user_id = "user-123_with.special@chars"
        token = create_access_token(user_id)
        
        verified_user_id = verify_token(token)
        
        assert verified_user_id == user_id


class TestEdgeCases:
    """Test edge cases and error conditions."""

    def test_empty_subject_token(self):
        """Test token creation with empty subject."""
        token = create_access_token("")
        
        verified_subject = verify_token(token)
        
        assert verified_subject == ""

    def test_none_subject_token(self):
        """Test token creation with None subject."""
        token = create_access_token(None)
        
        verified_subject = verify_token(token)
        
        assert verified_subject == "None"

    def test_very_long_subject_token(self):
        """Test token creation with very long subject."""
        long_subject = "a" * 1000
        token = create_access_token(long_subject)
        
        verified_subject = verify_token(token)
        
        assert verified_subject == long_subject

    def test_password_with_unicode(self):
        """Test password hashing with unicode characters."""
        password = "TestPassword123🚀🌟"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True

    def test_token_with_unicode_subject(self):
        """Test token creation with unicode subject."""
        unicode_subject = "user🚀🌟@example.com"
        token = create_access_token(unicode_subject)
        
        verified_subject = verify_token(token)
        
        assert verified_subject == unicode_subject 