from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from sqlmodel import Session

from app.schemas.competition import CompetitionCard
from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendationFeedback
)
from app.services.competition_service import get_featured_competitions
from app.services.ai_service import ai_recommendation_service
from app.core.deps import get_db

router = APIRouter()


@router.post("/", response_model=RecommendationResponse)
async def get_recommendations(
    request: RecommendationRequest,
    db: Session = Depends(get_db)
):
    """
    Get AI-powered competition recommendations.
    
    This endpoint:
    1. Takes user profile information (age, grade, GPA, interests)
    2. Uses rule-based AI to analyze suitable competitions
    3. Returns personalized recommendations with explanations
    
    This is a public endpoint that doesn't require authentication.
    """
    try:
        recommendations = await ai_recommendation_service.get_recommendations(
            user_profile=request.user_profile,
            db=db,
            max_recommendations=request.max_recommendations
        )
        
        return recommendations
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


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


@router.post("/feedback", response_model=dict)
async def submit_recommendation_feedback(
    feedback: RecommendationFeedback,
    db: Session = Depends(get_db)
):
    """
    Submit feedback on a recommendation.
    
    This endpoint allows users to provide feedback on recommendations
    to help improve the AI system.
    
    Args:
        feedback: User feedback data
        db: Database session
        
    Returns:
        Success message
    """
    try:
        # For now, just log the feedback
        # In the future, this could be stored in a database
        print(f"Recommendation feedback received: {feedback}")
        
        return {
            "message": "Thank you for your feedback!",
            "feedback_id": f"feedback_{feedback.competition_id}_{feedback.rating}"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit feedback: {str(e)}"
        ) 