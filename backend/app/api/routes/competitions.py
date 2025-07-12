from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from typing import List, Optional
from sqlmodel import Session

from app.schemas.competition import (
    CompetitionCreate,
    CompetitionUpdate,
    CompetitionResponse,
    CompetitionPublic,
    CompetitionCard,
    CompetitionListResponse,
    CompetitionSearchFilters,
    CompetitionWithCreator,
    CompetitionManagementListResponse,
    CompetitionManagement
)
from app.services.competition_service import (
    create_competition,
    get_competitions_list,
    get_competition_by_id,
    get_competition_by_id_with_creator,
    update_competition,
    delete_competition,
    upload_competition_image,
    get_featured_competitions,
    get_user_competitions,
    search_competitions,
    get_competitions_by_scale,
    get_upcoming_competitions,
    get_competitions_for_management
)
from app.core.deps import get_db, get_current_active_user, require_creator, require_admin
from app.models.user import User
from app.models.competition import CompetitionScale

router = APIRouter()


@router.get("/", response_model=CompetitionListResponse)
def read_competitions(
    skip: int = Query(0, ge=0, description="Number of competitions to skip"),
    limit: int = Query(100, ge=1, le=100, description="Number of competitions to return"),
    search: Optional[str] = Query(None, description="Search term for competition title or description"),
    location: Optional[str] = Query(None, description="Filter by location"),
    scale: Optional[CompetitionScale] = Query(None, description="Filter by competition scale"),
    is_featured: Optional[bool] = Query(None, description="Filter featured competitions"),
    age_min: Optional[int] = Query(None, ge=5, le=25, description="Minimum age filter"),
    age_max: Optional[int] = Query(None, ge=5, le=25, description="Maximum age filter"),
    grade_min: Optional[int] = Query(None, ge=1, le=12, description="Minimum grade filter"),
    grade_max: Optional[int] = Query(None, ge=1, le=12, description="Maximum grade filter"),
    subject_areas: Optional[List[str]] = Query(None, description="Subject area filters"),
    db: Session = Depends(get_db)
):
    """
    Get all competitions with optional filtering and pagination.
    
    This is a public endpoint that allows anyone to browse competitions.
    Supports:
    - Pagination (skip/limit)
    - Search by title/description
    - Filter by location, scale, featured status
    - Filter by age range and grade level
    - Filter by subject areas
    """
    # Build filters object
    filters = CompetitionSearchFilters(
        search=search,
        location=location,
        scale=scale,
        is_featured=is_featured,
        age_min=age_min,
        age_max=age_max,
        grade_min=grade_min,
        grade_max=grade_max,
        subject_areas=subject_areas
    )
    
    result = get_competitions_list(db, skip=skip, limit=limit, filters=filters)
    
    return CompetitionListResponse(
        competitions=[CompetitionPublic.model_validate(comp) for comp in result["competitions"]],
        total=result["total"],
        page=result["page"],
        size=result["size"],
        pages=result["pages"]
    )


@router.get("/featured", response_model=List[CompetitionCard])
def read_featured_competitions(
    limit: int = Query(10, ge=1, le=20, description="Number of featured competitions to return"),
    db: Session = Depends(get_db)
):
    """
    Get featured competitions for home page carousel.
    
    This endpoint returns a limited number of featured competitions
    suitable for display in a carousel or highlights section.
    """
    competitions = get_featured_competitions(db, limit=limit)
    
    return [CompetitionCard.model_validate(comp) for comp in competitions]


@router.get("/upcoming", response_model=List[CompetitionCard])
def read_upcoming_competitions(
    limit: int = Query(10, ge=1, le=20, description="Number of upcoming competitions to return"),
    db: Session = Depends(get_db)
):
    """
    Get upcoming competitions (registration still open).
    
    This endpoint returns competitions where registration is still open,
    ordered by registration deadline.
    """
    competitions = get_upcoming_competitions(db, limit=limit)
    
    return [CompetitionCard.model_validate(comp) for comp in competitions]


@router.get("/search", response_model=List[CompetitionPublic])
def search_competitions_endpoint(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return"),
    db: Session = Depends(get_db)
):
    """
    Search competitions by title and description.
    
    This endpoint provides full-text search functionality for competitions.
    """
    competitions = search_competitions(db, query=q, limit=limit)
    
    return [CompetitionPublic.model_validate(comp) for comp in competitions]


@router.get("/scale/{scale}", response_model=List[CompetitionCard])
def read_competitions_by_scale(
    scale: CompetitionScale,
    limit: int = Query(10, ge=1, le=20, description="Number of competitions to return"),
    db: Session = Depends(get_db)
):
    """
    Get competitions by scale/level.
    
    This endpoint filters competitions by their scale (local, regional, national, international).
    """
    competitions = get_competitions_by_scale(db, scale=scale, limit=limit)
    
    return [CompetitionCard.model_validate(comp) for comp in competitions]


@router.get("/my", response_model=CompetitionListResponse)
def read_my_competitions(
    skip: int = Query(0, ge=0, description="Number of competitions to skip"),
    limit: int = Query(100, ge=1, le=100, description="Number of competitions to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get competitions created by the current user.
    
    This endpoint allows users to view and manage their own competitions.
    """
    result = get_user_competitions(db, user_id=current_user.id, skip=skip, limit=limit)
    
    return CompetitionListResponse(
        competitions=[CompetitionResponse.model_validate(comp) for comp in result["competitions"]],
        total=result["total"],
        page=result["page"],
        size=result["size"],
        pages=result["pages"]
    )


@router.get("/management", response_model=CompetitionManagementListResponse)
def read_competitions_for_management(
    skip: int = Query(0, ge=0, description="Number of competitions to skip"),
    limit: int = Query(100, ge=1, le=100, description="Number of competitions to return"),
    search: Optional[str] = Query(None, description="Search term for competition title or description"),
    location: Optional[str] = Query(None, description="Filter by location"),
    scale: Optional[CompetitionScale] = Query(None, description="Filter by competition scale"),
    is_featured: Optional[bool] = Query(None, description="Filter featured competitions"),
    include_inactive: bool = Query(False, description="Include inactive competitions"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get competitions for management interface with creator information.
    
    This endpoint returns competitions with full creator information for management.
    - Admins can see all competitions
    - Creators can see only their own competitions
    """
    # Build filters object
    filters = CompetitionSearchFilters(
        search=search,
        location=location,
        scale=scale,
        is_featured=is_featured
    )
    
    result = get_competitions_for_management(
        db, 
        user=current_user, 
        skip=skip, 
        limit=limit, 
        filters=filters,
        include_inactive=include_inactive
    )
    
    return CompetitionManagementListResponse(
        competitions=[CompetitionManagement.model_validate(comp) for comp in result["competitions"]],
        total=result["total"],
        page=result["page"],
        size=result["size"],
        pages=result["pages"]
    )


@router.get("/{competition_id}", response_model=CompetitionWithCreator)
def read_competition(
    competition_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific competition by ID.
    
    This is a public endpoint that returns detailed competition information
    including creator information.
    """
    competition = get_competition_by_id_with_creator(db, competition_id)
    
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competition not found"
        )
    
    # Check if competition is active (or allow admins to see inactive)
    if not competition.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competition not found"
        )
    
    # Create response with creator information
    competition_data = CompetitionResponse.model_validate(competition)
    return CompetitionWithCreator(
        **competition_data.model_dump(),
        creator_username=competition.creator.username
    )


@router.post("/", response_model=CompetitionResponse)
def create_competition_endpoint(
    competition_create: CompetitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_creator)
):
    """
    Create a new competition.
    
    This endpoint allows authenticated users (creators/admins) to create competitions.
    Requires creator role or higher.
    """
    competition = create_competition(db, competition_create, current_user)
    
    return CompetitionResponse.model_validate(competition)


@router.put("/{competition_id}", response_model=CompetitionResponse)
def update_competition_endpoint(
    competition_id: int,
    competition_update: CompetitionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a competition.
    
    Users can update their own competitions, admins can update any competition.
    """
    competition = update_competition(db, competition_id, competition_update, current_user)
    
    return CompetitionResponse.model_validate(competition)


@router.delete("/{competition_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_competition_endpoint(
    competition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a competition.
    
    Users can delete their own competitions, admins can delete any competition.
    """
    delete_competition(db, competition_id, current_user)
    
    return None


@router.post("/{competition_id}/image", response_model=dict)
def upload_competition_image_endpoint(
    competition_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload an image for a competition.
    
    This endpoint allows users to upload images for their competitions.
    Supports common image formats (JPEG, PNG, GIF, WebP).
    """
    image_url = upload_competition_image(db, competition_id, file, current_user)
    
    return {"image_url": image_url}


# Admin-only endpoints
@router.get("/admin/all", response_model=CompetitionListResponse)
def read_all_competitions_admin(
    skip: int = Query(0, ge=0, description="Number of competitions to skip"),
    limit: int = Query(100, ge=1, le=100, description="Number of competitions to return"),
    include_inactive: bool = Query(False, description="Include inactive competitions"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get all competitions (admin only).
    
    This endpoint allows admins to view all competitions, including inactive ones.
    """
    result = get_competitions_list(db, skip=skip, limit=limit, include_inactive=include_inactive)
    
    return CompetitionListResponse(
        competitions=[CompetitionResponse.model_validate(comp) for comp in result["competitions"]],
        total=result["total"],
        page=result["page"],
        size=result["size"],
        pages=result["pages"]
    )


@router.put("/{competition_id}/admin", response_model=CompetitionResponse)
def admin_update_competition(
    competition_id: int,
    competition_update: CompetitionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin update for any competition.
    
    This endpoint allows admins to update any competition regardless of ownership.
    """
    competition = update_competition(db, competition_id, competition_update, current_user)
    
    return CompetitionResponse.model_validate(competition) 