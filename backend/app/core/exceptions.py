"""Custom exceptions for Science Competitions Insight."""

from typing import Any


class SCIException(Exception):
    """Base exception class for Science Competitions Insight."""

    def __init__(
        self,
        message: str,
        error_code: str | None = None,
        details: str | None = None,
        status_code: int = 500,
    ):
        self.message = message
        self.error_code = error_code
        self.details = details
        self.status_code = status_code
        super().__init__(self.message)


class AuthenticationError(SCIException):
    """Raised when authentication fails."""

    def __init__(
        self,
        message: str = "Authentication failed",
        error_code: str = "AUTH_001",
        details: str | None = None,
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
            status_code=401,
        )


class AuthorizationError(SCIException):
    """Raised when authorization fails."""

    def __init__(
        self,
        message: str = "Authorization failed",
        error_code: str = "AUTH_002",
        details: str | None = None,
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
            status_code=403,
        )


class UserNotFoundError(SCIException):
    """Raised when a user is not found."""

    def __init__(
        self,
        message: str = "User not found",
        error_code: str = "USER_001",
        details: str | None = None,
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
            status_code=404,
        )


class DuplicateUserError(SCIException):
    """Raised when trying to create a user that already exists."""

    def __init__(
        self,
        message: str = "User already exists",
        error_code: str = "USER_002",
        details: str | None = None,
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
            status_code=409,
        )


class CompetitionNotFoundError(SCIException):
    """Raised when a competition is not found."""

    def __init__(
        self,
        message: str = "Competition not found",
        error_code: str = "COMP_001",
        details: str | None = None,
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
            status_code=404,
        )


class PermissionDeniedError(SCIException):
    """Raised when user doesn't have permission for an action."""

    def __init__(
        self,
        message: str = "Permission denied",
        error_code: str = "PERM_001",
        details: str | None = None,
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
            status_code=403,
        )


class ValidationError(SCIException):
    """Raised when input validation fails."""

    def __init__(
        self,
        message: str = "Validation failed",
        error_code: str = "VAL_001",
        details: str | None = None,
        field_errors: dict[str, Any] | None = None,
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
            status_code=422,
        )
        self.field_errors = field_errors or {}


class DatabaseError(SCIException):
    """Raised when database operations fail."""

    def __init__(
        self,
        message: str = "Database operation failed",
        error_code: str = "DB_001",
        details: str | None = None,
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
            status_code=500,
        )


class RateLimitError(SCIException):
    """Raised when rate limit is exceeded."""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        error_code: str = "RATE_001",
        details: str | None = None,
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
            status_code=429,
        )


def format_error_response(exception: SCIException) -> dict[str, Any]:
    """Format exception into consistent error response."""
    error_response = {
        "error": {
            "type": exception.__class__.__name__.lower().replace("error", "_error"),
            "message": exception.message,
            "code": exception.error_code,
        }
    }

    if exception.details:
        error_response["error"]["details"] = exception.details

    if hasattr(exception, "field_errors") and exception.field_errors:
        error_response["error"]["field_errors"] = exception.field_errors

    return error_response
