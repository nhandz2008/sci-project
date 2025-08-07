"""Utility functions for common operations."""

import logging
from typing import Any
from uuid import UUID
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


def validate_uuid(uuid_str: str, entity_name: str = "entity") -> UUID:
    """Validate and convert string UUID to UUID object."""
    try:
        return UUID(uuid_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {entity_name} ID format"
        )


def sanitize_search_term(search_term: str) -> str:
    """Sanitize search term to prevent SQL injection."""
    # Remove potentially dangerous characters
    sanitized = search_term.replace("'", "").replace('"', "").replace(";", "")
    return sanitized.strip()


def log_security_event(event_type: str, details: dict[str, Any]) -> None:
    """Log security-related events."""
    logger.warning(f"Security event - {event_type}: {details}")


def validate_pagination_params(skip: int, limit: int, max_limit: int = 1000) -> tuple[int, int]:
    """Validate and normalize pagination parameters."""
    if skip < 0:
        skip = 0
    if limit < 1:
        limit = 10
    if limit > max_limit:
        limit = max_limit
    return skip, limit 