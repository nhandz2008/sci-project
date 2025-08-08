"""Competition routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.api.deps import get_current_active_user
from app.core.db import get_session
from app.crud.competition import (
    can_delete_competition,
    can_modify_competition,
    create_competition,
    delete_competition,
    get_competition_by_id,
    get_competitions,
    update_competition,
)
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.competition import (
    CompetitionCreate,
    CompetitionListPaginatedResponse,
    CompetitionListResponse,
    CompetitionResponse,
    CompetitionUpdate,
)

router = APIRouter(prefix="/competitions", tags=["competitions"])


@router.get("", response_model=CompetitionListPaginatedResponse)
async def get_competitions_list(
    session: Annotated[Session, Depends(get_session)],
    skip: int = Query(default=0, ge=0, description="Number of competitions to skip"),
    limit: int = Query(
        default=100, ge=1, le=1000, description="Number of competitions to return"
    ),
    format: str | None = Query(
        default=None, description="Filter by competition format"
    ),
    scale: str | None = Query(default=None, description="Filter by competition scale"),
    location: str | None = Query(default=None, description="Filter by location"),
    search: str | None = Query(
        default=None, description="Search in title and description"
    ),
    sort_by: str | None = Query(
        default=None, description="Sort by: created_at | registration_deadline | title"
    ),
    order: str | None = Query(default=None, description="Sort order: asc | desc"),
) -> CompetitionListPaginatedResponse:
    """Get competitions list (public - only approved competitions)."""
    competitions, total = get_competitions(
        session=session,
        skip=skip,
        limit=limit,
        format=format,
        scale=scale,
        location=location,
        search=search,
        is_approved=True,
        sort_by=sort_by,
        order=order,
    )

    return CompetitionListPaginatedResponse(
        competitions=[
            CompetitionListResponse.model_validate(comp) for comp in competitions
        ],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/featured", response_model=CompetitionListPaginatedResponse)
async def get_featured_competitions_list(
    session: Annotated[Session, Depends(get_session)],
    skip: int = Query(default=0, ge=0, description="Number of competitions to skip"),
    limit: int = Query(
        default=10, ge=1, le=1000, description="Number of competitions to return"
    ),
    sort_by: str | None = Query(
        default=None, description="Sort by: created_at | registration_deadline | title"
    ),
    order: str | None = Query(default=None, description="Sort order: asc | desc"),
) -> CompetitionListPaginatedResponse:
    """Get featured competitions (approved + featured)."""
    competitions, total = get_competitions(
        session=session,
        skip=skip,
        limit=limit,
        is_approved=True,
        is_featured=True,
        sort_by=sort_by,
        order=order,
    )

    return CompetitionListPaginatedResponse(
        competitions=[
            CompetitionListResponse.model_validate(comp) for comp in competitions
        ],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{competition_id}", response_model=CompetitionResponse)
async def get_competition_details(
    competition_id: str, session: Annotated[Session, Depends(get_session)]
) -> CompetitionResponse:
    """Get competition details by ID (public - only approved competitions)."""
    from uuid import UUID

    try:
        comp_uuid = UUID(competition_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid competition ID format",
        )

    competition = get_competition_by_id(session, comp_uuid)
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found"
        )

    # Only show approved competitions to public
    if not competition.is_approved:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found"
        )

    return CompetitionResponse.model_validate(competition)


@router.post("", response_model=CompetitionResponse)
async def create_new_competition(
    competition_create: CompetitionCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_session)],
) -> CompetitionResponse:
    """Create a new competition (authenticated users only)."""
    # Create competition
    competition = create_competition(session, competition_create, current_user.id)

    return CompetitionResponse.model_validate(competition)


@router.put("/{competition_id}", response_model=CompetitionResponse)
async def update_competition_by_id(
    competition_id: str,
    competition_update: CompetitionUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_session)],
) -> CompetitionResponse:
    """Update competition by ID (owner/admin only)."""
    from uuid import UUID

    try:
        comp_uuid = UUID(competition_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid competition ID format",
        )

    # Get competition
    competition = get_competition_by_id(session, comp_uuid)
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found"
        )

    # Check permissions
    if not can_modify_competition(current_user, competition):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to modify this competition",
        )

    # Update competition
    updated_competition = update_competition(session, competition, competition_update)

    return CompetitionResponse.model_validate(updated_competition)


@router.delete("/{competition_id}", response_model=MessageResponse)
async def delete_competition_by_id(
    competition_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_session)],
) -> MessageResponse:
    """Delete competition by ID (owner/admin only)."""
    from uuid import UUID

    try:
        comp_uuid = UUID(competition_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid competition ID format",
        )

    # Get competition
    competition = get_competition_by_id(session, comp_uuid)
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found"
        )

    # Check permissions
    if not can_delete_competition(current_user, competition):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this competition",
        )

    # Delete competition
    success = delete_competition(session, comp_uuid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete competition",
        )

    return MessageResponse(message="Competition deleted successfully")


@router.get("/my/competitions", response_model=CompetitionListPaginatedResponse)
async def get_my_competitions(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_session)],
    skip: int = Query(default=0, ge=0, description="Number of competitions to skip"),
    limit: int = Query(
        default=100, ge=1, le=1000, description="Number of competitions to return"
    ),
) -> CompetitionListPaginatedResponse:
    """Get current user's competitions."""
    competitions, total = get_competitions(
        session=session, skip=skip, limit=limit, owner_id=str(current_user.id)
    )

    return CompetitionListPaginatedResponse(
        competitions=[
            CompetitionListResponse.model_validate(comp) for comp in competitions
        ],
        total=total,
        skip=skip,
        limit=limit,
    )
