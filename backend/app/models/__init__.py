"""
SCI Models Module

This module exports all SQLModel models and related classes for the Science Competitions Insight application.
Handles circular dependencies between User and Competition models using TYPE_CHECKING.
"""

from typing import TYPE_CHECKING

# Import common models first (no dependencies)
from .common import Message, Token, TokenPayload, NewPassword, ForgotPasswordRequest, ForgotPasswordResponse, ResetPasswordRequest

# Import user models (these will be available immediately)
from .user import (
    User,
    UserBase,
    UserCreate,
    UserUpdate,
    UserPublic,
    UsersPublic,
    UserRole,
    UpdatePassword,
)

# Import competition models (these will be available immediately)
from .competition import (
    Competition,
    CompetitionBase,
    CompetitionCreate,
    CompetitionUpdate,
    CompetitionPublic,
    CompetitionsPublic,
    CompetitionFormat,
    CompetitionScale,
)

# Export all models for easy importing
__all__ = [
    # Common models
    "Message",
    "Token", 
    "TokenPayload",
    "NewPassword",
    "ForgotPasswordRequest",
    "ForgotPasswordResponse",
    "ResetPasswordRequest",
    
    # User models
    "User",
    "UserBase",
    "UserCreate",
    "UserUpdate", 
    "UserPublic",
    "UsersPublic",
    "UserRole",
    "UpdatePassword",
    
    # Competition models
    "Competition",
    "CompetitionBase",
    "CompetitionCreate",
    "CompetitionUpdate",
    "CompetitionPublic", 
    "CompetitionsPublic",
    "CompetitionFormat",
    "CompetitionScale",
]

# For type checking, ensure all models are available
if TYPE_CHECKING:
    # This ensures type checkers can see all the types
    # but doesn't cause runtime circular imports
    pass 