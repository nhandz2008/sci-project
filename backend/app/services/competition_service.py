from datetime import datetime, date
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select, func, col, or_, and_
from fastapi import HTTPException, status, UploadFile
from pathlib import Path
import uuid
import os

from app.models.competition import Competition, CompetitionScale
from app.models.user import User, UserRole
from app.schemas.competition import (
    CompetitionCreate,
    CompetitionUpdate,
    CompetitionResponse,
    CompetitionPublic,
    CompetitionCard,
    CompetitionListResponse,
    CompetitionSearchFilters,
    CompetitionWithCreator
)


def get_competition_by_id(db: Session, competition_id: int) -> Optional[Competition]:
    """
    Get competition by ID.
    
    Args:
        db: Database session
        competition_id: Competition ID
        
    Returns:
        Competition object if found, None otherwise
    """
    return db.get(Competition, competition_id)


def get_competition_by_id_with_creator(db: Session, competition_id: int) -> Optional[Competition]:
    """
    Get competition by ID with creator information.
    
    Args:
        db: Database session
        competition_id: Competition ID
        
    Returns:
        Competition object with creator relationship loaded
    """
    statement = select(Competition).where(Competition.id == competition_id)
    result = db.exec(statement).first()
    
    if result:
        # Ensure creator relationship is loaded
        db.refresh(result, ["creator"])
    
    return result


def get_competitions_list(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    filters: Optional[CompetitionSearchFilters] = None,
    include_inactive: bool = False
) -> Dict[str, Any]:
    """
    Get paginated list of competitions with filtering and search.
    
    Args:
        db: Database session
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        filters: Search and filter criteria
        include_inactive: Whether to include inactive competitions
        
    Returns:
        Dictionary containing competitions list and pagination info
    """
    # Build base query
    statement = select(Competition)
    
    # Apply filters
    conditions = []
    
    if not include_inactive:
        conditions.append(Competition.is_active == True)
    
    if filters:
        # Search in title and description
        if filters.search:
            search_term = f"%{filters.search}%"
            conditions.append(
                or_(
                    Competition.title.ilike(search_term),
                    Competition.description.ilike(search_term)
                )
            )
        
        # Filter by location
        if filters.location:
            conditions.append(Competition.location.ilike(f"%{filters.location}%"))
        
        # Filter by scale
        if filters.scale:
            conditions.append(Competition.scale == filters.scale)
        
        # Filter by featured status
        if filters.is_featured is not None:
            conditions.append(Competition.is_featured == filters.is_featured)
        
        # Filter by age range
        if filters.age_min is not None:
            conditions.append(
                or_(
                    Competition.target_age_min == None,
                    Competition.target_age_min <= filters.age_min
                )
            )
        
        if filters.age_max is not None:
            conditions.append(
                or_(
                    Competition.target_age_max == None,
                    Competition.target_age_max >= filters.age_max
                )
            )
        
        # Filter by grade range
        if filters.grade_min is not None:
            conditions.append(
                or_(
                    Competition.required_grade_min == None,
                    Competition.required_grade_min <= filters.grade_min
                )
            )
        
        if filters.grade_max is not None:
            conditions.append(
                or_(
                    Competition.required_grade_max == None,
                    Competition.required_grade_max >= filters.grade_max
                )
            )
        
        # Filter by subject areas
        if filters.subject_areas:
            subject_conditions = []
            for subject in filters.subject_areas:
                subject_conditions.append(Competition.subject_areas.ilike(f"%{subject}%"))
            conditions.append(or_(*subject_conditions))
    
    # Apply all conditions
    if conditions:
        statement = statement.where(and_(*conditions))
    
    # Order by featured first, then by registration deadline
    statement = statement.order_by(
        Competition.is_featured.desc(),
        Competition.registration_deadline.asc()
    )
    
    # Get total count for pagination
    count_statement = select(func.count(Competition.id))
    if conditions:
        count_statement = count_statement.where(and_(*conditions))
    
    total = db.exec(count_statement).first() or 0
    
    # Apply pagination
    statement = statement.offset(skip).limit(limit)
    
    competitions = db.exec(statement).all()
    
    # Calculate pagination info
    pages = (total + limit - 1) // limit  # Ceiling division
    
    return {
        "competitions": competitions,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "pages": pages
    }


def get_featured_competitions(db: Session, limit: int = 10) -> List[Competition]:
    """
    Get featured competitions for home page carousel.
    
    Args:
        db: Database session
        limit: Maximum number of competitions to return
        
    Returns:
        List of featured competitions
    """
    statement = select(Competition).where(
        and_(
            Competition.is_featured == True,
            Competition.is_active == True
        )
    ).order_by(Competition.created_at.desc()).limit(limit)
    
    return db.exec(statement).all()


def get_user_competitions(
    db: Session, 
    user_id: int, 
    skip: int = 0, 
    limit: int = 100
) -> Dict[str, Any]:
    """
    Get competitions created by a specific user.
    
    Args:
        db: Database session
        user_id: User ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        Dictionary containing user's competitions and pagination info
    """
    statement = select(Competition).where(Competition.created_by == user_id)
    
    # Get total count
    total = db.exec(select(func.count(Competition.id)).where(Competition.created_by == user_id)).first() or 0
    
    # Apply pagination and ordering
    statement = statement.order_by(Competition.created_at.desc()).offset(skip).limit(limit)
    
    competitions = db.exec(statement).all()
    
    # Calculate pagination info
    pages = (total + limit - 1) // limit
    
    return {
        "competitions": competitions,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "pages": pages
    }


def create_competition(
    db: Session, 
    competition_create: CompetitionCreate, 
    current_user: User
) -> Competition:
    """
    Create a new competition.
    
    Args:
        db: Database session
        competition_create: Competition creation data
        current_user: User creating the competition
        
    Returns:
        Created competition object
        
    Raises:
        HTTPException: If creation fails or validation errors
    """
    # Validate dates
    if competition_create.end_date <= competition_create.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )
    
    if competition_create.registration_deadline >= competition_create.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration deadline must be before start date"
        )
    
    # Validate age range
    if (competition_create.target_age_min is not None and 
        competition_create.target_age_max is not None and
        competition_create.target_age_max < competition_create.target_age_min):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum age must be greater than minimum age"
        )
    
    # Validate grade range
    if (competition_create.required_grade_min is not None and 
        competition_create.required_grade_max is not None and
        competition_create.required_grade_max < competition_create.required_grade_min):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum grade must be greater than minimum grade"
        )
    
    # Create competition object
    competition_data = competition_create.model_dump()
    competition_data["created_by"] = current_user.id
    
    # Convert URLs to strings if they are HttpUrl objects
    if competition_data.get("image_url"):
        competition_data["image_url"] = str(competition_data["image_url"])
    if competition_data.get("external_url"):
        competition_data["external_url"] = str(competition_data["external_url"])
    
    competition = Competition(**competition_data)
    
    # Save to database
    db.add(competition)
    db.commit()
    db.refresh(competition)
    
    return competition


def update_competition(
    db: Session, 
    competition_id: int, 
    competition_update: CompetitionUpdate, 
    current_user: User
) -> Competition:
    """
    Update an existing competition.
    
    Args:
        db: Database session
        competition_id: Competition ID to update
        competition_update: Updated competition data
        current_user: User attempting the update
        
    Returns:
        Updated competition object
        
    Raises:
        HTTPException: If competition not found or user lacks permission
    """
    competition = get_competition_by_id(db, competition_id)
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competition not found"
        )
    
    # Check permissions - owner or admin can update
    if competition.created_by != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this competition"
        )
    
    # Get update data, excluding None values
    update_data = competition_update.model_dump(exclude_unset=True)
    
    # Validate dates if being updated
    start_date = update_data.get("start_date", competition.start_date)
    end_date = update_data.get("end_date", competition.end_date)
    registration_deadline = update_data.get("registration_deadline", competition.registration_deadline)
    
    if end_date <= start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )
    
    if registration_deadline >= start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration deadline must be before start date"
        )
    
    # Validate age range
    target_age_min = update_data.get("target_age_min", competition.target_age_min)
    target_age_max = update_data.get("target_age_max", competition.target_age_max)
    
    if (target_age_min is not None and target_age_max is not None and 
        target_age_max < target_age_min):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum age must be greater than minimum age"
        )
    
    # Validate grade range
    required_grade_min = update_data.get("required_grade_min", competition.required_grade_min)
    required_grade_max = update_data.get("required_grade_max", competition.required_grade_max)
    
    if (required_grade_min is not None and required_grade_max is not None and 
        required_grade_max < required_grade_min):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum grade must be greater than minimum grade"
        )
    
    # Convert URLs to strings if they are HttpUrl objects
    if update_data.get("image_url"):
        update_data["image_url"] = str(update_data["image_url"])
    if update_data.get("external_url"):
        update_data["external_url"] = str(update_data["external_url"])
    
    # Update competition fields
    for field, value in update_data.items():
        setattr(competition, field, value)
    
    # Update timestamp
    competition.updated_at = datetime.utcnow()
    
    # Save to database
    db.commit()
    db.refresh(competition)
    
    return competition


def delete_competition(
    db: Session, 
    competition_id: int, 
    current_user: User
) -> bool:
    """
    Delete a competition.
    
    Args:
        db: Database session
        competition_id: Competition ID to delete
        current_user: User attempting the deletion
        
    Returns:
        True if deletion successful
        
    Raises:
        HTTPException: If competition not found or user lacks permission
    """
    competition = get_competition_by_id(db, competition_id)
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competition not found"
        )
    
    # Check permissions - owner or admin can delete
    if competition.created_by != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this competition"
        )
    
    # Delete from database
    db.delete(competition)
    db.commit()
    
    return True


def upload_competition_image(
    db: Session, 
    competition_id: int, 
    file: UploadFile, 
    current_user: User
) -> str:
    """
    Upload and save competition image.
    
    Args:
        db: Database session
        competition_id: Competition ID
        file: Uploaded image file
        current_user: User uploading the image
        
    Returns:
        URL of the uploaded image
        
    Raises:
        HTTPException: If upload fails or user lacks permission
    """
    competition = get_competition_by_id(db, competition_id)
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competition not found"
        )
    
    # Check permissions
    if competition.created_by != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload image for this competition"
        )
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Create upload directory if it doesn't exist
    upload_dir = Path("uploads/competitions")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = upload_dir / unique_filename
    
    try:
        with open(file_path, "wb") as buffer:
            content = file.file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image: {str(e)}"
        )
    
    # Update competition with image URL
    image_url = f"/uploads/competitions/{unique_filename}"
    competition.image_url = image_url
    competition.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(competition)
    
    return image_url


def search_competitions(
    db: Session, 
    query: str, 
    limit: int = 10
) -> List[Competition]:
    """
    Search competitions by title and description.
    
    Args:
        db: Database session
        query: Search query
        limit: Maximum number of results to return
        
    Returns:
        List of matching competitions
    """
    search_term = f"%{query}%"
    
    statement = select(Competition).where(
        and_(
            Competition.is_active == True,
            or_(
                Competition.title.ilike(search_term),
                Competition.description.ilike(search_term)
            )
        )
    ).order_by(Competition.is_featured.desc(), Competition.created_at.desc()).limit(limit)
    
    return db.exec(statement).all()


def get_competitions_by_scale(
    db: Session, 
    scale: CompetitionScale, 
    limit: int = 10
) -> List[Competition]:
    """
    Get competitions by scale/level.
    
    Args:
        db: Database session
        scale: Competition scale
        limit: Maximum number of results to return
        
    Returns:
        List of competitions with specified scale
    """
    statement = select(Competition).where(
        and_(
            Competition.scale == scale,
            Competition.is_active == True
        )
    ).order_by(Competition.registration_deadline.asc()).limit(limit)
    
    return db.exec(statement).all()


def get_upcoming_competitions(
    db: Session, 
    limit: int = 10
) -> List[Competition]:
    """
    Get upcoming competitions (registration still open).
    
    Args:
        db: Database session
        limit: Maximum number of results to return
        
    Returns:
        List of upcoming competitions
    """
    today = date.today()
    
    statement = select(Competition).where(
        and_(
            Competition.registration_deadline > today,
            Competition.is_active == True
        )
    ).order_by(Competition.registration_deadline.asc()).limit(limit)
    
    return db.exec(statement).all() 