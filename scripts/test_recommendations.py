#!/usr/bin/env python3
"""
Test script for the AI Recommendation System

This script tests the recommendation API endpoint with various user profiles
to ensure the rule-based recommendation system is working correctly.
"""

import asyncio
import json
import sys
import os
from datetime import date
from typing import Dict, Any

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlmodel import Session, create_engine, select
from app.services.ai_service import AIRecommendationService
from app.schemas.recommendation import UserProfileRequest, RecommendationRequest
from app.core.config import settings
from app.models.competition import Competition, CompetitionScale
from app.models.user import User
from app.core.security import get_password_hash

# Test user profiles
TEST_PROFILES = [
    {
        "name": "High School Robotics Enthusiast",
        "profile": {
            "age": 16,
            "grade": 11,
            "gpa": 3.8,
            "interests": ["robotics", "engineering", "programming"],
            "preferred_scale": ["national", "international"],
            "location_preference": "remote"
        }
    },
    {
        "name": "Middle School Science Explorer",
        "profile": {
            "age": 13,
            "grade": 7,
            "gpa": 3.5,
            "interests": ["biology", "environmental science", "chemistry"],
            "preferred_scale": ["local", "regional"],
            "location_preference": "local"
        }
    },
    {
        "name": "Elementary School Math Whiz",
        "profile": {
            "age": 10,
            "grade": 5,
            "gpa": 3.9,
            "interests": ["mathematics", "computer science"],
            "preferred_scale": ["local"],
            "location_preference": "local"
        }
    },
    {
        "name": "College Physics Student",
        "profile": {
            "age": 20,
            "grade": 12,
            "gpa": 3.7,
            "interests": ["physics", "astronomy", "space"],
            "preferred_scale": ["national", "international"],
            "location_preference": "remote"
        }
    }
]

def create_test_data(db: Session) -> None:
    """Create test competitions and users for testing."""
    
    # Create test user if it doesn't exist
    test_user = db.exec(
        select(User).where(User.email == "test@example.com")
    ).first()
    
    if not test_user:
        test_user = User(
            email="test@example.com",
            username="testuser",
            hashed_password=get_password_hash("testpass123"),
            role="creator",
            is_active=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
    
    # Create test competitions if they don't exist
    existing_competitions = db.exec(select(Competition)).all()
    
    if len(existing_competitions) < 5:
        test_competitions = [
            {
                "title": "National Robotics Challenge",
                "description": "A prestigious robotics competition for high school students",
                "location": "Remote",
                "scale": CompetitionScale.NATIONAL,
                "start_date": date(2024, 6, 1),
                "end_date": date(2024, 6, 30),
                "registration_deadline": date(2024, 5, 15),
                "target_age_min": 14,
                "target_age_max": 18,
                "required_grade_min": 9,
                "required_grade_max": 12,
                "subject_areas": "robotics, engineering, programming",
                "is_featured": True,
                "featured_priority": 90,
                "created_by": test_user.id
            },
            {
                "title": "Local Science Fair",
                "description": "Annual science fair for elementary and middle school students",
                "location": "Community Center",
                "scale": CompetitionScale.LOCAL,
                "start_date": date(2024, 4, 15),
                "end_date": date(2024, 4, 20),
                "registration_deadline": date(2024, 4, 1),
                "target_age_min": 8,
                "target_age_max": 14,
                "required_grade_min": 3,
                "required_grade_max": 8,
                "subject_areas": "biology, chemistry, physics, environmental science",
                "is_featured": True,
                "featured_priority": 85,
                "created_by": test_user.id
            },
            {
                "title": "International Physics Olympiad",
                "description": "Worldwide physics competition for high school students",
                "location": "Various Locations",
                "scale": CompetitionScale.INTERNATIONAL,
                "start_date": date(2024, 7, 15),
                "end_date": date(2024, 7, 25),
                "registration_deadline": date(2024, 6, 1),
                "target_age_min": 16,
                "target_age_max": 20,
                "required_grade_min": 10,
                "required_grade_max": 12,
                "subject_areas": "physics, mathematics",
                "is_featured": True,
                "featured_priority": 95,
                "created_by": test_user.id
            },
            {
                "title": "Regional Math Competition",
                "description": "Mathematics competition for middle school students",
                "location": "Regional University",
                "scale": CompetitionScale.REGIONAL,
                "start_date": date(2024, 5, 10),
                "end_date": date(2024, 5, 12),
                "registration_deadline": date(2024, 4, 25),
                "target_age_min": 11,
                "target_age_max": 15,
                "required_grade_min": 6,
                "required_grade_max": 9,
                "subject_areas": "mathematics, statistics",
                "is_featured": False,
                "featured_priority": 50,
                "created_by": test_user.id
            },
            {
                "title": "Environmental Science Challenge",
                "description": "Competition focused on environmental solutions",
                "location": "Online",
                "scale": CompetitionScale.NATIONAL,
                "start_date": date(2024, 8, 1),
                "end_date": date(2024, 8, 31),
                "registration_deadline": date(2024, 7, 15),
                "target_age_min": 12,
                "target_age_max": 18,
                "required_grade_min": 7,
                "required_grade_max": 12,
                "subject_areas": "environmental science, biology, chemistry",
                "is_featured": True,
                "featured_priority": 80,
                "created_by": test_user.id
            }
        ]
        
        for comp_data in test_competitions:
            competition = Competition(**comp_data)
            db.add(competition)
        
        db.commit()
        print("✅ Test data created successfully!")

async def test_recommendations() -> None:
    """Test the AI recommendation system with various user profiles."""
    
    # Create database engine and session
    engine = create_engine(settings.DATABASE_URL)
    
    with Session(engine) as db:
        # Create test data
        create_test_data(db)
        
        # Initialize AI service
        ai_service = AIRecommendationService()
        
        print("🧠 Testing AI Recommendation System")
        print("=" * 50)
        
        for test_case in TEST_PROFILES:
            print(f"\n👤 Testing Profile: {test_case['name']}")
            print("-" * 30)
            
            # Create user profile request
            user_profile = UserProfileRequest(**test_case['profile'])
            
            try:
                # Get recommendations
                recommendations = await ai_service.get_recommendations(
                    user_profile=user_profile,
                    db=db,
                    max_recommendations=3
                )
                
                # Display results
                print(f"📊 Profile Summary: {recommendations.user_profile_summary}")
                print(f"🔍 Total competitions analyzed: {recommendations.total_competitions_analyzed}")
                print(f"🎯 Strategy used: {recommendations.recommendation_strategy}")
                
                if recommendations.stats:
                    print(f"📈 Average match score: {recommendations.stats.average_match_score:.1%}")
                    print(f"⭐ Recommendation quality: {recommendations.stats.recommendation_quality}")
                
                print("\n🏆 Top Recommendations:")
                for i, rec in enumerate(recommendations.recommendations, 1):
                    print(f"  {i}. {rec.competition.title}")
                    print(f"     📍 {rec.competition.location} • {rec.competition.scale}")
                    print(f"     🎯 Match Score: {rec.match_score:.1%}")
                    print(f"     💡 Reasons: {', '.join(rec.match_reasons)}")
                    print()
                
            except Exception as e:
                print(f"❌ Error testing profile '{test_case['name']}': {str(e)}")
        
        print("\n✅ Recommendation system test completed!")

def main():
    """Main function to run the test."""
    print("🚀 Starting AI Recommendation System Test")
    print("=" * 50)
    
    try:
        asyncio.run(test_recommendations())
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 