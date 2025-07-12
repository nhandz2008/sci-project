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
    CompetitionWithCreator,
    CompetitionManagement,
    CompetitionManagementListResponse,
    CreatorInfo
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
    
    # Order by featured priority first, then by registration deadline
    statement = statement.order_by(
        Competition.featured_priority.desc(),
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
        List of featured competitions ordered by priority
    """
    statement = select(Competition).where(
        and_(
            Competition.is_featured == True,
            Competition.is_active == True
        )
    ).order_by(
        Competition.featured_priority.desc(),  # Higher priority first
        Competition.registration_deadline.asc()  # Then by deadline
    ).limit(limit)
    
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
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        
    Returns:
        Dictionary containing user's competitions and pagination info
    """
    # Build query for user's competitions
    statement = select(Competition).where(Competition.created_by == user_id)
    
    # Order by creation date (newest first)
    statement = statement.order_by(Competition.created_at.desc())
    
    # Get total count
    count_statement = select(func.count(Competition.id)).where(Competition.created_by == user_id)
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


def get_competitions_for_management(
    db: Session, 
    user: User,
    skip: int = 0, 
    limit: int = 100,
    filters: Optional[CompetitionSearchFilters] = None,
    include_inactive: bool = False
) -> Dict[str, Any]:
    """
    Get competitions for management interface with full creator information.
    
    Args:
        db: Database session
        user: Current user (determines what competitions they can see)
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        filters: Search and filter criteria
        include_inactive: Whether to include inactive competitions
        
    Returns:
        Dictionary containing competitions with creator info and pagination info
    """
    # Build base query with join to get creator information
    statement = select(Competition, User).join(User, Competition.created_by == User.id)
    
    # Apply filters
    conditions = []
    
    # Role-based filtering
    if user.role != UserRole.ADMIN:
        # Non-admin users can only see their own competitions
        conditions.append(Competition.created_by == user.id)
    
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
    
    # Order by featured priority first, then by creation date
    statement = statement.order_by(
        Competition.featured_priority.desc(),
        Competition.created_at.desc()
    )
    
    # Get total count for pagination
    count_statement = select(func.count(Competition.id)).select_from(
        select(Competition).join(User, Competition.created_by == User.id)
    )
    if conditions:
        count_statement = count_statement.where(and_(*conditions))
    
    total = db.exec(count_statement).first() or 0
    
    # Apply pagination
    statement = statement.offset(skip).limit(limit)
    
    results = db.exec(statement).all()
    
    # Transform results to include creator information
    competitions_with_creators = []
    for competition, creator in results:
        competition_dict = competition.model_dump()
        competition_dict['creator'] = {
            'id': creator.id,
            'username': creator.username,
            'email': creator.email,
            'role': creator.role
        }
        competitions_with_creators.append(competition_dict)
    
    # Calculate pagination info
    pages = (total + limit - 1) // limit  # Ceiling division
    
    return {
        "competitions": competitions_with_creators,
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
        competition_create: Competition data
        current_user: User creating the competition
        
    Returns:
        Created competition
        
    Raises:
        HTTPException: If creation fails
    """
    # Only admins can set competitions as featured
    if competition_create.is_featured and current_user.role != UserRole.ADMIN:
        competition_create.is_featured = False
    
    # Create competition data
    competition_data = competition_create.model_dump()
    competition_data["created_by"] = current_user.id
    competition_data["created_at"] = datetime.utcnow()
    
    # Convert HttpUrl objects to strings for database storage
    if competition_data.get("image_url"):
        competition_data["image_url"] = str(competition_data["image_url"])
    if competition_data.get("external_url"):
        competition_data["external_url"] = str(competition_data["external_url"])
    
    # Create competition
    competition = Competition(**competition_data)
    
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
        Updated competition
        
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
    
    # Only admins can set competitions as featured
    if competition_update.is_featured is not None and current_user.role != UserRole.ADMIN:
        competition_update.is_featured = competition.is_featured  # Keep existing value
    
    # Update competition with provided data
    update_data = competition_update.model_dump(exclude_unset=True)
    
    # Handle datetime fields
    if "start_date" in update_data:
        update_data["start_date"] = competition_update.start_date
    if "end_date" in update_data:
        update_data["end_date"] = competition_update.end_date
    if "registration_deadline" in update_data:
        update_data["registration_deadline"] = competition_update.registration_deadline
    
    # Convert HttpUrl objects to strings for database storage
    if "image_url" in update_data and update_data["image_url"]:
        update_data["image_url"] = str(update_data["image_url"])
    if "external_url" in update_data and update_data["external_url"]:
        update_data["external_url"] = str(update_data["external_url"])
    
    # Add updated timestamp
    update_data["updated_at"] = datetime.utcnow()
    
    # Apply updates
    for field, value in update_data.items():
        setattr(competition, field, value)
    
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