"""
Common utility functions used across the application.

This module contains helper functions that are used by multiple parts of the application.
"""

from typing import Optional, Dict, Any
import uuid


def generate_uuid() -> str:
    """Generate a UUID string."""
    return str(uuid.uuid4())


def clean_filename(filename: str) -> str:
    """
    Clean a filename to make it safe for storage.
    
    This will be useful for file uploads (competition images).
    
    Args:
        filename: Original filename
        
    Returns:
        Cleaned filename
    """
    # Basic implementation - we'll enhance this later
    return filename.lower().replace(" ", "_")


def format_response(data: Any, message: str = "Success") -> Dict[str, Any]:
    """
    Format a standard API response.
    
    Args:
        data: The response data
        message: Optional message
        
    Returns:
        Formatted response dictionary
    """
    return {
        "success": True,
        "message": message,
        "data": data
    }


def format_error_response(message: str, details: Optional[str] = None) -> Dict[str, Any]:
    """
    Format a standard error response.
    
    Args:
        message: Error message
        details: Optional error details
        
    Returns:
        Formatted error response dictionary
    """
    response = {
        "success": False,
        "message": message
    }
    
    if details:
        response["details"] = details
        
    return response 