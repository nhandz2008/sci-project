"""CRUD tests for competition management."""

from datetime import datetime, timedelta, timezone

from sqlmodel import Session

from app.crud.competition import (
    approve_competition,
    can_delete_competition,
    can_modify_competition,
    create_competition,
    delete_competition,
    get_approved_competitions,
    get_competition_by_id,
    get_competitions,
    get_competitions_by_owner,
    get_featured_competitions,
    get_pending_competitions,
    reject_competition,
    set_competition_active,
    set_competition_featured,
    update_competition,
)
from app.crud.user import create_user
from app.models.common import CompetitionFormat, CompetitionScale, UserRole
from app.schemas.auth import UserCreate
from app.schemas.competition import CompetitionCreate, CompetitionUpdate


def _future_deadline(days: int = 10) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)


def _create_competition_data(**overrides):
    """Create test competition data."""
    data = {
        "title": "Test Competition",
        "introduction": "A test competition for testing.",
        "overview": "This is a comprehensive overview of the test competition.",
        "question_type": "Multiple Choice",
        "selection_process": "Online Test",
        "history": "Established in 2024",
        "scoring_and_format": "100 points total",
        "awards": "Gold, Silver, Bronze medals",
        "penalties_and_bans": "No cheating allowed",
        "notable_achievements": "Previous winners from top universities",
        "competition_link": "https://example.com/competition",
        "background_image_url": "https://example.com/bg.jpg",
        "detail_image_urls": [
            "https://example.com/d1.jpg",
            "https://example.com/d2.jpg",
        ],
        "location": "Test City",
        "format": CompetitionFormat.ONLINE,
        "scale": CompetitionScale.REGIONAL,
        "registration_deadline": _future_deadline(30),
        "size": 100,
        "target_age_min": 16,
        "target_age_max": 20,
    }
    data.update(overrides)
    return data


def _create_test_user(
    session: Session, email: str = "test@example.com", role: UserRole = UserRole.CREATOR
):
    """Create a test user."""
    user_data = {
        "email": email,
        "full_name": "Test User",
        "organization": "Test Org",
        "phone_number": "+1234567890",
        "password": "TestPass123",
    }
    user_create = UserCreate(**user_data)
    user = create_user(session, user_create)
    user.role = role
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


class TestCompetitionCRUD:
    """Test competition CRUD operations."""

    def test_create_competition(self, session: Session):
        """Test creating a competition."""
        user = _create_test_user(session)
        competition_data = _create_competition_data()
        competition_create = CompetitionCreate(**competition_data)

        competition = create_competition(session, competition_create, user.id)

        assert competition.title == competition_data["title"]
        assert competition.introduction == competition_data["introduction"]
        assert competition.overview == competition_data["overview"]
        assert competition.owner_id == str(user.id)
        assert competition.is_active is True
        assert competition.is_featured is False
        assert competition.is_approved is False
        assert (
            competition.detail_image_urls_list == competition_data["detail_image_urls"]
        )

    def test_get_competition_by_id(self, session: Session):
        """Test getting a competition by ID."""
        user = _create_test_user(session)
        competition_data = _create_competition_data()
        competition_create = CompetitionCreate(**competition_data)
        created_competition = create_competition(session, competition_create, user.id)

        retrieved_competition = get_competition_by_id(session, created_competition.id)

        assert retrieved_competition is not None
        assert retrieved_competition.id == created_competition.id
        assert retrieved_competition.title == competition_data["title"]

    def test_get_competition_by_id_not_found(self, session: Session):
        """Test getting a non-existent competition."""
        from uuid import uuid4

        competition = get_competition_by_id(session, uuid4())
        assert competition is None

    def test_update_competition(self, session: Session):
        """Test updating a competition."""
        user = _create_test_user(session)
        competition_data = _create_competition_data()
        competition_create = CompetitionCreate(**competition_data)
        competition = create_competition(session, competition_create, user.id)

        update_data = {
            "title": "Updated Competition",
            "introduction": "Updated introduction",
            "overview": "Updated overview",
            "size": 200,
        }
        competition_update = CompetitionUpdate(**update_data)

        updated_competition = update_competition(
            session, competition, competition_update
        )

        assert updated_competition.title == "Updated Competition"
        assert updated_competition.introduction == "Updated introduction"
        assert updated_competition.overview == "Updated overview"
        assert updated_competition.size == 200
        # Other fields should remain unchanged
        assert updated_competition.location == competition_data["location"]

    def test_delete_competition(self, session: Session):
        """Test deleting a competition."""
        user = _create_test_user(session)
        competition_data = _create_competition_data()
        competition_create = CompetitionCreate(**competition_data)
        competition = create_competition(session, competition_create, user.id)

        success = delete_competition(session, competition.id)
        assert success is True

        # Verify competition is deleted
        retrieved_competition = get_competition_by_id(session, competition.id)
        assert retrieved_competition is None

    def test_delete_competition_not_found(self, session: Session):
        """Test deleting a non-existent competition."""
        from uuid import uuid4

        success = delete_competition(session, uuid4())
        assert success is False

    def test_get_competitions_with_filters(self, session: Session):
        """Test getting competitions with various filters."""
        user = _create_test_user(session)

        # Create competitions with different attributes
        competitions_data = [
            _create_competition_data(
                title="Online Competition",
                format=CompetitionFormat.ONLINE,
                location="City A",
                is_approved=True,
            ),
            _create_competition_data(
                title="Offline Competition",
                format=CompetitionFormat.OFFLINE,
                location="City B",
                is_approved=True,
            ),
            _create_competition_data(
                title="Hybrid Competition",
                format=CompetitionFormat.HYBRID,
                location="City C",
                is_approved=False,
            ),
        ]

        created_competitions = []
        for data in competitions_data:
            competition_create = CompetitionCreate(**data)
            competition = create_competition(session, competition_create, user.id)
            created_competitions.append(competition)

        # Test format filter
        competitions, total = get_competitions(session, format=CompetitionFormat.ONLINE)
        assert total == 1
        assert competitions[0].format == CompetitionFormat.ONLINE

        # Test location filter (case-insensitive)
        competitions, total = get_competitions(session, location="city")
        assert total == 3  # Should match all cities

        # Test approval filter
        competitions, total = get_competitions(session, is_approved=True)
        assert total == 2

        # Test search filter
        competitions, total = get_competitions(session, search="online")
        assert total == 1
        assert "Online" in competitions[0].title

        # Test owner filter
        competitions, total = get_competitions(session, owner_id=str(user.id))
        assert total == 3

    def test_get_competitions_with_pagination(self, session: Session):
        """Test getting competitions with pagination."""
        user = _create_test_user(session)

        # Create multiple competitions
        for i in range(5):
            data = _create_competition_data(title=f"Competition {i}")
            competition_create = CompetitionCreate(**data)
            create_competition(session, competition_create, user.id)

        # Test pagination
        competitions, total = get_competitions(session, skip=0, limit=3)
        assert len(competitions) == 3
        assert total == 5

        competitions, total = get_competitions(session, skip=3, limit=3)
        assert len(competitions) == 2
        assert total == 5

    def test_get_competitions_with_sorting(self, session: Session):
        """Test getting competitions with sorting."""
        user = _create_test_user(session)

        # Create competitions with different titles
        titles = ["Zebra Competition", "Alpha Competition", "Beta Competition"]
        for title in titles:
            data = _create_competition_data(title=title)
            competition_create = CompetitionCreate(**data)
            create_competition(session, competition_create, user.id)

        # Test sorting by title ascending
        competitions, total = get_competitions(session, sort_by="title", order="asc")
        assert total == 3
        assert competitions[0].title == "Alpha Competition"
        assert competitions[1].title == "Beta Competition"
        assert competitions[2].title == "Zebra Competition"

        # Test sorting by title descending
        competitions, total = get_competitions(session, sort_by="title", order="desc")
        assert total == 3
        assert competitions[0].title == "Zebra Competition"
        assert competitions[1].title == "Beta Competition"
        assert competitions[2].title == "Alpha Competition"

    def test_get_pending_competitions(self, session: Session):
        """Test getting pending competitions."""
        user = _create_test_user(session)

        # Create competitions with different approval statuses
        for i in range(3):
            data = _create_competition_data(title=f"Competition {i}")
            competition_create = CompetitionCreate(**data)
            competition = create_competition(session, competition_create, user.id)

            # Approve first competition
            if i == 0:
                competition.is_approved = True
                session.add(competition)
                session.commit()

        competitions, total = get_pending_competitions(session)
        assert total == 2  # Only unapproved competitions

    def test_get_competitions_by_owner(self, session: Session):
        """Test getting competitions by owner."""
        user1 = _create_test_user(session, "user1@example.com")
        user2 = _create_test_user(session, "user2@example.com")

        # Create competitions for different owners
        for user in [user1, user2]:
            for i in range(2):
                data = _create_competition_data(
                    title=f"Competition by {user.email} {i}"
                )
                competition_create = CompetitionCreate(**data)
                create_competition(session, competition_create, user.id)

        competitions, total = get_competitions_by_owner(session, user1.id)
        assert total == 2
        assert all(comp.owner_id == str(user1.id) for comp in competitions)

    def test_get_featured_competitions(self, session: Session):
        """Test getting featured competitions."""
        user = _create_test_user(session)

        # Create competitions with different featured statuses
        for i in range(3):
            data = _create_competition_data(title=f"Competition {i}")
            competition_create = CompetitionCreate(**data)
            competition = create_competition(session, competition_create, user.id)

            # Make first competition featured
            if i == 0:
                competition.is_featured = True
                competition.is_approved = True
                session.add(competition)
                session.commit()

        competitions, total = get_featured_competitions(session)
        assert total == 1
        assert competitions[0].is_featured is True

    def test_get_approved_competitions(self, session: Session):
        """Test getting approved competitions."""
        user = _create_test_user(session)

        # Create competitions with different approval statuses
        for i in range(3):
            data = _create_competition_data(title=f"Competition {i}")
            competition_create = CompetitionCreate(**data)
            competition = create_competition(session, competition_create, user.id)

            # Approve first two competitions
            if i < 2:
                competition.is_approved = True
                session.add(competition)
                session.commit()

        competitions, total = get_approved_competitions(session)
        assert total == 2
        assert all(comp.is_approved is True for comp in competitions)

    def test_approve_competition(self, session: Session):
        """Test approving a competition."""
        user = _create_test_user(session)
        admin = _create_test_user(session, "admin@example.com", UserRole.ADMIN)

        competition_data = _create_competition_data()
        competition_create = CompetitionCreate(**competition_data)
        competition = create_competition(session, competition_create, user.id)

        success = approve_competition(session, competition.id, admin.id)
        assert success is True

        # Verify competition is approved
        session.refresh(competition)
        assert competition.is_approved is True
        assert competition.approved_by == admin.id
        assert competition.approved_at is not None

    def test_reject_competition(self, session: Session):
        """Test rejecting a competition."""
        user = _create_test_user(session)
        admin = _create_test_user(session, "admin@example.com", UserRole.ADMIN)

        competition_data = _create_competition_data()
        competition_create = CompetitionCreate(**competition_data)
        competition = create_competition(session, competition_create, user.id)

        rejection_reason = "Incomplete information"
        success = reject_competition(
            session, competition.id, admin.id, rejection_reason
        )
        assert success is True

        # Verify competition is rejected
        session.refresh(competition)
        assert competition.is_approved is False
        assert competition.approved_by == admin.id
        assert competition.approved_at is not None
        assert competition.rejection_reason == rejection_reason

    def test_set_competition_featured(self, session: Session):
        """Test setting competition as featured."""
        user = _create_test_user(session)

        competition_data = _create_competition_data()
        competition_create = CompetitionCreate(**competition_data)
        competition = create_competition(session, competition_create, user.id)

        # Test featuring
        success = set_competition_featured(session, competition.id, True)
        assert success is True

        session.refresh(competition)
        assert competition.is_featured is True

        # Test unfeaturing
        success = set_competition_featured(session, competition.id, False)
        assert success is True

        session.refresh(competition)
        assert competition.is_featured is False

    def test_set_competition_active(self, session: Session):
        """Test setting competition as active/inactive."""
        user = _create_test_user(session)

        competition_data = _create_competition_data()
        competition_create = CompetitionCreate(**competition_data)
        competition = create_competition(session, competition_create, user.id)

        # Test deactivating
        success = set_competition_active(session, competition.id, False)
        assert success is True

        session.refresh(competition)
        assert competition.is_active is False

        # Test activating
        success = set_competition_active(session, competition.id, True)
        assert success is True

        session.refresh(competition)
        assert competition.is_active is True

    def test_can_modify_competition(self, session: Session):
        """Test competition modification permissions."""
        creator = _create_test_user(session, "creator@example.com", UserRole.CREATOR)
        admin = _create_test_user(session, "admin@example.com", UserRole.ADMIN)
        other_creator = _create_test_user(
            session, "other@example.com", UserRole.CREATOR
        )

        competition_data = _create_competition_data()
        competition_create = CompetitionCreate(**competition_data)
        competition = create_competition(session, competition_create, creator.id)

        # Creator can modify their own competition
        assert can_modify_competition(creator, competition) is True

        # Admin can modify any competition
        assert can_modify_competition(admin, competition) is True

        # Other creator cannot modify
        assert can_modify_competition(other_creator, competition) is False

    def test_can_delete_competition(self, session: Session):
        """Test competition deletion permissions."""
        creator = _create_test_user(session, "creator@example.com", UserRole.CREATOR)
        admin = _create_test_user(session, "admin@example.com", UserRole.ADMIN)
        other_creator = _create_test_user(
            session, "other@example.com", UserRole.CREATOR
        )

        competition_data = _create_competition_data()
        competition_create = CompetitionCreate(**competition_data)
        competition = create_competition(session, competition_create, creator.id)

        # Creator can delete their own competition
        assert can_delete_competition(creator, competition) is True

        # Admin can delete any competition
        assert can_delete_competition(admin, competition) is True

        # Other creator cannot delete
        assert can_delete_competition(other_creator, competition) is False

    def test_competition_with_overview_field(self, session: Session):
        """Test competition creation and retrieval with overview field."""
        user = _create_test_user(session)
        competition_data = _create_competition_data(
            overview="This is a comprehensive overview of the competition."
        )
        competition_create = CompetitionCreate(**competition_data)

        competition = create_competition(session, competition_create, user.id)

        assert (
            competition.overview
            == "This is a comprehensive overview of the competition."
        )

        # Test retrieval
        retrieved_competition = get_competition_by_id(session, competition.id)
        assert retrieved_competition is not None
        assert (
            retrieved_competition.overview
            == "This is a comprehensive overview of the competition."
        )

        # Test update with overview
        update_data = {"overview": "Updated overview content"}
        competition_update = CompetitionUpdate(**update_data)
        updated_competition = update_competition(
            session, competition, competition_update
        )

        assert updated_competition.overview == "Updated overview content"
