#!/usr/bin/env python3
"""
Script to create test users for authentication testing.
Run this after creating the database to have test accounts.
"""

import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session
from app.core.deps import engine
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def create_test_users():
    """Create test users for authentication testing."""
    
    with Session(engine) as session:
        # Check if users already exist
        from sqlmodel import select
        statement = select(User).where(User.email == "admin@sci.com")
        existing_admin = session.exec(statement).first()
        
        if existing_admin:
            print("Test users already exist. Skipping creation.")
            return
        
        # Create admin user
        admin_user = User(
            email="admin@sci.com",
            username="admin",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        
        # Create creator user
        creator_user = User(
            email="creator@sci.com",
            username="creator",
            hashed_password=get_password_hash("creator123"),
            role=UserRole.CREATOR,
            is_active=True
        )
        
        # Create test creator user
        test_user = User(
            email="test@sci.com",
            username="testuser",
            hashed_password=get_password_hash("test123"),
            role=UserRole.CREATOR,
            is_active=True
        )
        
        # Add users to session
        session.add(admin_user)
        session.add(creator_user)
        session.add(test_user)
        
        # Commit to database
        session.commit()
        
        print("✅ Test users created successfully!")
        print("\nTest Account Details:")
        print("==================")
        print("Admin User:")
        print("  Email: admin@sci.com")
        print("  Password: admin123")
        print("  Role: ADMIN")
        print()
        print("Creator User:")
        print("  Email: creator@sci.com")
        print("  Password: creator123") 
        print("  Role: CREATOR")
        print()
        print("Test User:")
        print("  Email: test@sci.com")
        print("  Password: test123")
        print("  Role: CREATOR")
        print()
        print("You can now use these accounts to test the authentication system!")


if __name__ == "__main__":
    print("Creating test users...")
    try:
        create_test_users()
    except Exception as e:
        print(f"❌ Error creating test users: {e}")
        sys.exit(1) 