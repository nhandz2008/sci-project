"""Competition CRUD operations."""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import asc, desc, text
from sqlalchemy import or_ as sa_or
from sqlmodel import Session, select

from app.models.competition import Competition
from app.models.user import User
from app.schemas.competition import CompetitionCreate, CompetitionUpdate


def create_competition(
    session: Session, competition_create: CompetitionCreate, owner_id: UUID
) -> Competition:
    """Create a new competition."""
    # Create competition object
    competition = Competition(
        title=competition_create.title,
        introduction=competition_create.introduction,
        question_type=competition_create.question_type,
        selection_process=competition_create.selection_process,
        history=competition_create.history,
        scoring_and_format=competition_create.scoring_and_format,
        awards=competition_create.awards,
        penalties_and_bans=competition_create.penalties_and_bans,
        notable_achievements=competition_create.notable_achievements,
        competition_link=competition_create.competition_link,
        background_image_url=competition_create.background_image_url,
        detail_image_urls_list=competition_create.detail_image_urls,
        location=competition_create.location,
        format=competition_create.format,
        scale=competition_create.scale,
        registration_deadline=competition_create.registration_deadline,
        size=competition_create.size,
        target_age_min=competition_create.target_age_min,
        target_age_max=competition_create.target_age_max,
        owner_id=str(owner_id),
        is_active=True,
        is_featured=False,
        is_approved=False,  # Requires admin approval
    )

    # Add to database
    session.add(competition)
    session.commit()
    session.refresh(competition)

    return competition


def get_competition_by_id(session: Session, competition_id: UUID) -> Competition | None:
    """Get competition by ID."""
    statement = select(Competition).where(Competition.id == competition_id)
    return session.exec(statement).first()


def get_competitions(
    session: Session,
    skip: int = 0,
    limit: int = 100,
    format: str | None = None,
    scale: str | None = None,
    location: str | None = None,
    is_approved: bool | None = None,
    is_featured: bool | None = None,
    search: str | None = None,
    owner_id: str | None = None,
    sort_by: str | None = None,
    order: str | None = None,
) -> tuple[list[Competition], int]:
    """Get competitions with pagination and filtering."""
    # Build base query with filters only (no sort/pagination yet)
    query = select(Competition)

    # Add filters
    if format is not None:
        query = query.where(Competition.format == format)
    if scale is not None:
        query = query.where(Competition.scale == scale)
    if location is not None:
        # Case-insensitive match on PostgreSQL
        query = query.where(text("location ILIKE :loc").bindparams(loc=f"%{location}%"))
    if is_approved is not None:
        query = query.where(Competition.is_approved == is_approved)
    if is_featured is not None:
        query = query.where(Competition.is_featured == is_featured)
    if owner_id is not None:
        query = query.where(Competition.owner_id == owner_id)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            sa_or(
                text("title ILIKE :s"),
                text("introduction ILIKE :s"),
            )
        ).params(s=search_term)

    # Sorting
    if sort_by is not None:
        sort_key = sort_by.strip().lower()
        sort_column = None
        if sort_key == "created_at":
            sort_column = Competition.created_at
        elif sort_key == "registration_deadline":
            sort_column = Competition.registration_deadline
        elif sort_key == "title":
            # Use deterministic ASCII collation to match Python's default ordering
            sort_column = text('title COLLATE "C"')

        if sort_column is not None:
            is_desc = (order or "").strip().lower() == "desc"
            query = query.order_by(desc(sort_column) if is_desc else asc(sort_column))

    # Get total count before sorting/pagination
    count_query = select(text("COUNT(*)")).select_from(query.subquery())
    total = session.exec(count_query).first() or 0

    # Sorting
    if sort_by is not None:
        sort_key = sort_by.strip().lower()
        sort_column = None
        if sort_key == "created_at":
            sort_column = Competition.created_at
        elif sort_key == "registration_deadline":
            sort_column = Competition.registration_deadline
        elif sort_key == "title":
            sort_column = text('title COLLATE "C"')

        if sort_column is not None:
            is_desc = (order or "").strip().lower() == "desc"
            query = query.order_by(desc(sort_column) if is_desc else asc(sort_column))

    # Pagination
    query = query.offset(skip).limit(limit)

    # Execute query
    competitions = session.exec(query).all()

    return competitions, total


def update_competition(
    session: Session, competition: Competition, competition_update: CompetitionUpdate
) -> Competition:
    """Update competition."""
    # Update only provided fields
    update_data = competition_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "detail_image_urls" and value is not None:
            competition.detail_image_urls_list = value
        else:
            setattr(competition, field, value)

    session.add(competition)
    session.commit()
    session.refresh(competition)

    return competition


def delete_competition(session: Session, competition_id: UUID) -> bool:
    """Delete competition by ID."""
    competition = get_competition_by_id(session, competition_id)
    if not competition:
        return False

    session.delete(competition)
    session.commit()
    return True


def get_pending_competitions(
    session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[Competition], int]:
    """Get competitions pending approval."""
    # Build query for pending competitions
    # Newly created competitions default to is_approved=False → treat as pending
    query = select(Competition).where(Competition.is_approved == False)  # noqa: E712

    # Get total count
    count_query = select(text("COUNT(*)")).select_from(query.subquery())
    total = session.exec(count_query).first() or 0

    # Add pagination
    query = query.offset(skip).limit(limit)

    # Execute query
    competitions = session.exec(query).all()

    return competitions, total


def approve_competition(
    session: Session, competition_id: UUID, admin_user_id: UUID
) -> bool:
    """Approve competition."""
    competition = get_competition_by_id(session, competition_id)
    if not competition:
        return False

    competition.is_approved = True
    competition.approved_by = admin_user_id
    competition.approved_at = datetime.now(timezone.utc)
    competition.rejection_reason = None
    session.add(competition)
    session.commit()
    return True


def reject_competition(
    session: Session,
    competition_id: UUID,
    admin_user_id: UUID,
    rejection_reason: str | None = None,
) -> bool:
    """Reject competition."""
    competition = get_competition_by_id(session, competition_id)
    if not competition:
        return False

    competition.is_approved = False
    competition.is_featured = False
    competition.approved_by = admin_user_id
    competition.approved_at = datetime.now(timezone.utc)
    competition.rejection_reason = (
        (rejection_reason or "")[:500] if rejection_reason else None
    )
    session.add(competition)
    session.commit()
    return True


def set_competition_featured(
    session: Session, competition_id: UUID, is_featured: bool
) -> bool:
    """Toggle featured flag (admin only)."""
    competition = get_competition_by_id(session, competition_id)
    if not competition:
        return False
    competition.is_featured = bool(is_featured)
    session.add(competition)
    session.commit()
    return True


def set_competition_active(
    session: Session, competition_id: UUID, is_active: bool
) -> bool:
    """Toggle active flag (admin only)."""
    competition = get_competition_by_id(session, competition_id)
    if not competition:
        return False
    competition.is_active = bool(is_active)
    session.add(competition)
    session.commit()
    return True


def can_modify_competition(user: User, competition: Competition) -> bool:
    """Check if user can modify competition."""
    # Admin can modify any competition
    if user.role.value == "ADMIN":
        return True

    # Owner can modify their own competition
    if competition.owner_id == str(user.id):
        return True

    return False


def can_delete_competition(user: User, competition: Competition) -> bool:
    """Check if user can delete competition."""
    # Admin can delete any competition
    if user.role.value == "ADMIN":
        return True

    # Owner can delete their own competition
    if competition.owner_id == str(user.id):
        return True

    return False


def get_competitions_by_owner(
    session: Session, owner_id: UUID, skip: int = 0, limit: int = 100
) -> tuple[list[Competition], int]:
    """Get competitions by owner."""
    competitions, total = get_competitions(
        session=session, skip=skip, limit=limit, owner_id=str(owner_id)
    )
    return competitions, total


def get_featured_competitions(
    session: Session, skip: int = 0, limit: int = 10
) -> tuple[list[Competition], int]:
    """Get featured competitions."""
    competitions, total = get_competitions(
        session=session, skip=skip, limit=limit, is_featured=True, is_approved=True
    )
    return competitions, total


def get_approved_competitions(
    session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[Competition], int]:
    """Get approved competitions for public viewing."""
    competitions, total = get_competitions(
        session=session, skip=skip, limit=limit, is_approved=True
    )
    return competitions, total
