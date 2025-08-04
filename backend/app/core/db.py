from sqlmodel import Session, create_engine, select
from sqlalchemy.exc import ProgrammingError

from app import crud
from app.core.config import settings
from app.models import User, UserCreate, UserRole

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def check_tables_exist(session: Session) -> bool:
    """Check if database tables exist"""
    try:
        # Try to query the user table to see if it exists
        session.exec(select(User).limit(1))
        return True
    except ProgrammingError:
        return False


def init_db(session: Session) -> None:
    """Initialize database with admin user if it doesn't exist"""
    # Check if tables exist first
    if not check_tables_exist(session):
        print("⚠️  Database tables don't exist. Please run migrations first.")
        return
    
    # Check if admin user exists
    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    
    if not user:
        print(f"👤 Creating admin user: {settings.FIRST_SUPERUSER}")
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            role=UserRole.ADMIN,
        )
        user = crud.create_user(session=session, user_create=user_in)
        session.commit()
        print("✅ Admin user created successfully")
    else:
        print("✅ Admin user already exists")
