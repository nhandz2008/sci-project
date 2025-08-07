"""Admin routes for content moderation."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.api.deps import get_current_admin_user
from app.core.db import get_session
from app.crud.competition import (
    approve_competition,
    get_pending_competitions,
    reject_competition,
)
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.competition import (
    CompetitionModerationListResponse,
    CompetitionModerationResponse,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/competitions/pending", response_model=CompetitionModerationListResponse)
async def get_pending_competitions_list(
    _current_user: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[Session, Depends(get_session)],
    skip: int = Query(default=0, ge=0, description="Number of competitions to skip"),
    limit: int = Query(
        default=100, ge=1, le=1000, description="Number of competitions to return"
    ),
) -> CompetitionModerationListResponse:
    """Get pending competitions for moderation (admin only)."""
    competitions, total = get_pending_competitions(
        session=session, skip=skip, limit=limit
    )

    return CompetitionModerationListResponse(
        competitions=[
            CompetitionModerationResponse.model_validate(comp) for comp in competitions
        ],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.put("/competitions/{competition_id}/approve", response_model=MessageResponse)
async def approve_competition_by_id(
    competition_id: str,
    _current_user: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[Session, Depends(get_session)],
) -> MessageResponse:
    """Approve competition by ID (admin only)."""
    from uuid import UUID

    try:
        comp_uuid = UUID(competition_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid competition ID format",
        )

    # Approve competition
    success = approve_competition(session, comp_uuid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found"
        )

    return MessageResponse(message="Competition approved successfully")


@router.put("/competitions/{competition_id}/reject", response_model=MessageResponse)
async def reject_competition_by_id(
    competition_id: str,
    _current_user: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[Session, Depends(get_session)],
) -> MessageResponse:
    """Reject competition by ID (admin only)."""
    from uuid import UUID

    try:
        comp_uuid = UUID(competition_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid competition ID format",
        )

    # Reject competition
    success = reject_competition(session, comp_uuid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found"
        )

    return MessageResponse(message="Competition rejected successfully")
