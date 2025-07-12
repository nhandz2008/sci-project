from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from sqlmodel import Session

from app.schemas.competition import CompetitionCard
from app.services.competition_service import get_featured_competitions
from app.core.deps import get_db

router = APIRouter()


@router.post("/", response_model=List[dict])
def get_recommendations():
    """
    Get AI-powered competition recommendations.
    
    This endpoint:
    1. Takes user profile information (age, grade, GPA, interests)
    2. Uses AI to analyze suitable competitions
    3. Returns personalized recommendations with explanations
    
    This is a public endpoint that doesn't require authentication.
    """
    # Placeholder - will be implemented later
    return [{"message": "AI recommendations endpoint - to be implemented"}]


@router.get("/featured", response_model=List[CompetitionCard])
def get_featured_competitions_api(
    limit: int = Query(default=10, ge=1, le=50, description="Maximum number of featured competitions to return"),
    db: Session = Depends(get_db)
):
    """
    Get featured competitions for the homepage carousel.
    
    This endpoint returns a curated list of featured competitions
    ordered by priority and registration deadline.
    
    Args:
        limit: Maximum number of competitions to return (1-50)
        db: Database session
        
    Returns:
        List of featured competition cards
    """
    try:
        featured_competitions = get_featured_competitions(db, limit=limit)
        
        # Convert to CompetitionCard format
        competition_cards = []
        for competition in featured_competitions:
            card = CompetitionCard(
                id=competition.id,
                title=competition.title,
                location=competition.location,
                scale=competition.scale,
                registration_deadline=competition.registration_deadline,
                image_url=competition.image_url,
                is_featured=competition.is_featured
            )
            competition_cards.append(card)
        
        return competition_cards
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch featured competitions: {str(e)}"
        ) 