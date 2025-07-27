from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional
from uuid import UUID
from sqlmodel import Session

from app.api.deps import SessionDep, CurrentActiveUser
from app.crud import get_competitions, get_competition, create_competition
from app.models import CompetitionFormat, CompetitionScale, CompetitionsPublic, CompetitionPublic, CompetitionCreate, User, CompetitionUpdate, Message
from app.crud import update_competition, delete_competition

router = APIRouter(prefix="/competitions", tags=["competitions"])

# Competition CRUD endpoints - Phase 7.1 implementation

@router.get("/", response_model=CompetitionsPublic, summary="List competitions with filtering and pagination")
def list_competitions(
    session: SessionDep,
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Results per page (max 100)"),
    owner_id: Optional[UUID] = Query(None, description="Filter by owner UUID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured status"),
    format: Optional[CompetitionFormat] = Query(None, description="Filter by competition format"),
    scale: Optional[CompetitionScale] = Query(None, description="Filter by competition scale"),
) -> CompetitionsPublic:
    """
    List competitions with optional filtering and pagination.
    - **Public endpoint**
    - Supports filtering by owner, status, format, scale
    - Supports pagination (skip, limit)
    """
    competitions = get_competitions(
        session=session,
        skip=skip,
        limit=limit,
        owner_id=owner_id,
        is_active=is_active,
        is_featured=is_featured,
    )
    # In-memory filter for format/scale (if needed)
    if format is not None:
        competitions = [c for c in competitions if c.format == format]
    if scale is not None:
        competitions = [c for c in competitions if c.scale == scale]
    return CompetitionsPublic(data=competitions, count=len(competitions))

@router.get("/{id}", response_model=CompetitionPublic, summary="Get competition details by ID")
def get_competition_detail(
    id: UUID,
    session: SessionDep,
) -> CompetitionPublic:
    """
    Retrieve detailed information about a specific competition by its UUID.
    - **Public endpoint**
    - Returns 404 if competition not found
    """
    competition = get_competition(session=session, competition_id=id)
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    return competition

@router.post("/", response_model=CompetitionPublic, status_code=201, summary="Create a new competition (authenticated)")
def create_competition_endpoint(
    competition_in: CompetitionCreate,
    session: SessionDep,
    current_user: CurrentActiveUser,
) -> CompetitionPublic:
    """
    Create a new competition. Only authenticated users can create competitions.
    - Sets the current user as the owner
    - Validates input using CompetitionCreate model
    - Returns the created competition
    - Returns 400 for validation errors
    """
    competition = create_competition(
        session=session,
        competition_in=competition_in,
        owner_id=current_user.id,
    )
    return competition

@router.put("/{id}", response_model=CompetitionPublic, summary="Update a competition (owner or admin)")
def update_competition_endpoint(
    id: UUID,
    competition_in: CompetitionUpdate,
    session: SessionDep,
    current_user: CurrentActiveUser,
) -> CompetitionPublic:
    """
    Update a competition. Only the owner or an admin can update.
    - Checks if the current user is the owner or an admin
    - Validates input using CompetitionUpdate model
    - Returns the updated competition
    - Returns 404 if not found, 403 if not authorized
    """
    db_competition = get_competition(session=session, competition_id=id)
    if not db_competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    if db_competition.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this competition")
    updated = update_competition(
        session=session,
        db_competition=db_competition,
        competition_in=competition_in,
    )
    return updated

@router.delete("/{id}", response_model=Message, summary="Delete a competition (owner or admin)")
def delete_competition_endpoint(
    id: UUID,
    session: SessionDep,
    current_user: CurrentActiveUser,
) -> Message:
    """
    Delete a competition. Only the owner or an admin can delete.
    - Checks if the current user is the owner or an admin
    - Returns 404 if not found, 403 if not authorized
    - Returns a success message on deletion
    """
    db_competition = get_competition(session=session, competition_id=id)
    if not db_competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    if db_competition.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this competition")
    delete_competition(session=session, competition_id=id)
    return Message(message="Competition deleted successfully")

# Old placeholder endpoint removed - replaced with full CRUD implementation above 