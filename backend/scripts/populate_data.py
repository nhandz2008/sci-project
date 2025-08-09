#!/usr/bin/env python3
"""
Script to populate the database with dummy data for development and testing.
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import UUID

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Import after path setup
from sqlmodel import Session, create_engine  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.crud.competition import create_competition  # noqa: E402
from app.crud.user import create_user, get_user_by_email  # noqa: E402
from app.models.common import UserRole  # noqa: E402
from app.schemas.auth import UserCreate  # noqa: E402
from app.schemas.competition import CompetitionCreate  # noqa: E402


def load_dummy_data() -> dict[str, Any]:
    """Load dummy data from JSON file."""
    data_file = Path(__file__).parent.parent.parent / "data" / "dummy_data.json"

    if not data_file.exists():
        raise FileNotFoundError(f"Dummy data file not found: {data_file}")

    with open(data_file) as f:
        return json.load(f)


def create_admin_user(session: Session) -> None:
    """Create admin user if it doesn't exist."""
    admin_email = settings.FIRST_SUPERUSER
    admin_password = settings.FIRST_SUPERUSER_PASSWORD

    # Check if admin user already exists
    existing_admin = get_user_by_email(session, admin_email)
    if existing_admin:
        print(f"✅ Admin user already exists: {admin_email}")
        return

    # Create admin user
    admin_data = UserCreate(
        email=admin_email,
        full_name="Admin User",
        organization="SCI Platform",
        phone_number="+1234567890",
        password=admin_password,
    )

    try:
        admin_user = create_user(session, admin_data)
        # Set admin role
        admin_user.role = UserRole.ADMIN
        session.add(admin_user)
        session.commit()
        print(f"✅ Created admin user: {admin_email}")
    except Exception as e:
        print(f"❌ Failed to create admin user: {e}")
        session.rollback()
        raise


def create_creator_users(
    session: Session, users_data: list[dict[str, Any]]
) -> dict[str, str]:
    """Create creator users and return email to user_id mapping."""
    email_to_id = {}

    for user_data in users_data:
        if user_data.get("role") == "CREATOR":
            email = user_data["email"]

            # Check if user already exists
            existing_user = get_user_by_email(session, email)
            if existing_user:
                print(f"✅ Creator user already exists: {email}")
                email_to_id[email] = str(existing_user.id)
                continue

            # Create user
            user_create = UserCreate(
                email=email,
                full_name=user_data["full_name"],
                organization=user_data["organization"],
                phone_number=user_data["phone_number"],
                password=user_data["password"],
            )

            try:
                user = create_user(session, user_create)
                email_to_id[email] = str(user.id)
                print(f"✅ Created creator user: {email}")
            except Exception as e:
                print(f"❌ Failed to create creator user {email}: {e}")
                session.rollback()
                raise

    return email_to_id


def create_competitions(
    session: Session,
    competitions_data: list[dict[str, Any]],
    email_to_id: dict[str, str],
) -> None:
    """Create competitions."""
    created_count = 0

    for comp_data in competitions_data:
        owner_email = comp_data.get("owner_email")
        if not owner_email or owner_email not in email_to_id:
            print(
                f"⚠️  Skipping competition '{comp_data['title']}': owner email not found"
            )
            continue

        owner_uuid = UUID(email_to_id[owner_email])

        # Parse registration deadline
        try:
            registration_deadline = datetime.fromisoformat(
                comp_data["registration_deadline"].replace("Z", "+00:00")
            )
        except ValueError:
            print(
                f"⚠️  Skipping competition '{comp_data['title']}': invalid registration_deadline format"
            )
            continue

        # Create competition data
        competition_create = CompetitionCreate(
            title=comp_data.get("title"),
            introduction=comp_data.get("introduction"),
            overview=comp_data.get("overview"),
            question_type=comp_data.get("question_type"),
            selection_process=comp_data.get("selection_process"),
            history=comp_data.get("history"),
            scoring_and_format=comp_data.get("scoring_and_format"),
            awards=comp_data.get("awards"),
            penalties_and_bans=comp_data.get("penalties_and_bans"),
            notable_achievements=comp_data.get("notable_achievements"),
            competition_link=comp_data.get("competition_link"),
            background_image_url=comp_data.get("background_image_url"),
            detail_image_urls=(
                comp_data.get("detail_image_urls")
                if comp_data.get("detail_image_urls") is not None
                else []
            ),
            location=comp_data.get("location"),
            format=comp_data.get("format"),
            scale=comp_data.get("scale"),
            registration_deadline=registration_deadline,
            size=comp_data.get("size"),
            target_age_min=comp_data.get("target_age_min"),
            target_age_max=comp_data.get("target_age_max"),
        )

        try:
            competition = create_competition(session, competition_create, owner_uuid)

            # Set approval and featured status after creation
            competition.is_approved = comp_data.get("is_approved", False)
            competition.is_featured = comp_data.get("is_featured", False)

            # Manually set detail_image_urls directly
            competition.detail_image_urls = json.dumps(
                comp_data.get("detail_image_urls", [])
            )

            session.add(competition)
            session.commit()

            created_count += 1
            print(f"✅ Created competition: {comp_data['title']}")
        except Exception as e:
            print(f"❌ Failed to create competition '{comp_data['title']}': {e}")
            session.rollback()
            raise

    print(f"✅ Created {created_count} competitions")


def main():
    """Main function to populate database with dummy data."""
    import argparse

    parser = argparse.ArgumentParser(description="Populate database with dummy data")
    parser.add_argument(
        "--admin-only", action="store_true", help="Only create admin user"
    )
    args = parser.parse_args()

    print("🚀 Starting database population...")

    # Create database engine
    engine = create_engine(
        str(settings.SQLALCHEMY_DATABASE_URI),
        echo=settings.DATABASE_ECHO,
    )

    # Create session
    with Session(engine) as session:
        try:
            # Create admin user
            create_admin_user(session)

            if args.admin_only:
                print("✅ Admin user creation completed")
                return 0

            # Load dummy data for full population
            try:
                data = load_dummy_data()
                print("✅ Loaded dummy data from JSON file")
            except Exception as e:
                print(f"❌ Failed to load dummy data: {e}")
                return 1

            # Create creator users
            users_data = data.get("users", [])
            email_to_id = create_creator_users(session, users_data)

            # Create competitions
            competitions_data = data.get("competitions", [])
            create_competitions(session, competitions_data, email_to_id)

            print("🎉 Database population completed successfully!")
            print("📊 Summary:")
            print(f"   - Admin user: {settings.FIRST_SUPERUSER}")
            print(
                f"   - Creator users: {len([u for u in users_data if u.get('role') == 'CREATOR'])}"
            )
            print(f"   - Competitions: {len(competitions_data)}")
            print(
                f"   - Featured competitions: {len([c for c in competitions_data if c.get('is_featured')])}"
            )
            print(
                f"   - Approved competitions: {len([c for c in competitions_data if c.get('is_approved')])}"
            )

        except Exception as e:
            print(f"❌ Database population failed: {e}")
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
