from typing import List, Dict, Tuple, Optional
from datetime import date, datetime
import logging
from sqlmodel import Session, select
from app.models.competition import Competition, CompetitionScale
from app.schemas.recommendation import (
    UserProfileRequest,
    CompetitionRecommendation,
    RecommendationResponse,
    RecommendationStats
)

logger = logging.getLogger(__name__)

# Scoring weights for different matching factors
MATCHING_WEIGHTS = {
    "age_compatibility": 0.25,
    "grade_level": 0.20,
    "subject_interests": 0.25,
    "location_preference": 0.15,
    "competition_scale": 0.10,
    "deadline_urgency": 0.05
}

# Subject area keywords for matching
SUBJECT_KEYWORDS = {
    "robotics": ["robotics", "robot", "automation", "mechatronics", "engineering"],
    "computer_science": ["programming", "coding", "software", "computer", "algorithm", "ai", "machine learning"],
    "biology": ["biology", "life sciences", "genetics", "microbiology", "ecology", "biochemistry"],
    "chemistry": ["chemistry", "chemical", "molecular", "organic", "inorganic", "biochemistry"],
    "physics": ["physics", "mechanics", "optics", "quantum", "astronomy", "astrophysics"],
    "mathematics": ["math", "mathematics", "statistics", "calculus", "algebra", "geometry"],
    "environmental": ["environment", "climate", "sustainability", "renewable", "green"],
    "medicine": ["medical", "health", "medicine", "pharmaceutical", "biomedical"],
    "space": ["space", "astronomy", "astrophysics", "satellite", "rocket", "nasa"],
    "engineering": ["engineering", "mechanical", "electrical", "civil", "aerospace"]
}

class AIRecommendationService:
    """
    Rule-based AI recommendation service for matching users with science competitions.
    
    This service uses weighted scoring algorithms to match user profiles with
    available competitions based on multiple factors including age, grade level,
    interests, location, and competition characteristics.
    """
    
    def __init__(self):
        self.weights = MATCHING_WEIGHTS
        self.subject_keywords = SUBJECT_KEYWORDS
    
    async def get_recommendations(
        self, 
        user_profile: UserProfileRequest,
        db: Session,
        max_recommendations: int = 5
    ) -> RecommendationResponse:
        """
        Generate personalized competition recommendations based on user profile.
        
        Args:
            user_profile: User's profile information
            db: Database session
            max_recommendations: Maximum number of recommendations to return
            
        Returns:
            RecommendationResponse with personalized recommendations
        """
        try:
            # Get all active competitions
            competitions = await self._get_active_competitions(db)
            
            if not competitions:
                return RecommendationResponse(
                    recommendations=[],
                    total_competitions_analyzed=0,
                    recommendation_strategy="rule_based",
                    user_profile_summary=self._generate_profile_summary(user_profile)
                )
            
            # Filter and score competitions
            scored_competitions = await self._score_competitions(user_profile, competitions)
            
            # Sort by score and take top recommendations
            top_recommendations = sorted(
                scored_competitions, 
                key=lambda x: x.match_score, 
                reverse=True
            )[:max_recommendations]
            
            # Generate recommendation statistics
            stats = await self._generate_recommendation_stats(
                user_profile, competitions, top_recommendations
            )
            
            return RecommendationResponse(
                recommendations=top_recommendations,
                total_competitions_analyzed=len(competitions),
                recommendation_strategy="rule_based",
                user_profile_summary=self._generate_profile_summary(user_profile),
                stats=stats
            )
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            raise
    
    async def _get_active_competitions(self, db: Session) -> List[Competition]:
        """Get all active competitions from the database."""
        statement = select(Competition).where(Competition.is_active == True)
        result = db.exec(statement)
        return list(result.all())
    
    async def _score_competitions(
        self, 
        user_profile: UserProfileRequest, 
        competitions: List[Competition]
    ) -> List[CompetitionRecommendation]:
        """Score each competition based on user profile."""
        recommendations = []
        
        for competition in competitions:
            # Calculate individual scores
            age_score = self._calculate_age_compatibility(user_profile, competition)
            grade_score = self._calculate_grade_compatibility(user_profile, competition)
            subject_score = self._calculate_subject_interest_match(user_profile, competition)
            location_score = self._calculate_location_preference(user_profile, competition)
            scale_score = self._calculate_scale_preference(user_profile, competition)
            urgency_score = self._calculate_deadline_urgency(competition)
            
            # Calculate weighted total score
            total_score = (
                age_score * self.weights["age_compatibility"] +
                grade_score * self.weights["grade_level"] +
                subject_score * self.weights["subject_interests"] +
                location_score * self.weights["location_preference"] +
                scale_score * self.weights["competition_scale"] +
                urgency_score * self.weights["deadline_urgency"]
            )
            
            # Generate match reasons
            match_reasons = self._generate_match_reasons(
                user_profile, competition, {
                    "age_score": age_score,
                    "grade_score": grade_score,
                    "subject_score": subject_score,
                    "location_score": location_score,
                    "scale_score": scale_score,
                    "urgency_score": urgency_score
                }
            )
            
            # Calculate confidence based on score consistency
            confidence = self._calculate_confidence([
                age_score, grade_score, subject_score, 
                location_score, scale_score, urgency_score
            ])
            
            recommendations.append(CompetitionRecommendation(
                competition=competition,
                match_score=round(total_score, 3),
                match_reasons=match_reasons,
                confidence=round(confidence, 3)
            ))
        
        return recommendations
    
    def _calculate_age_compatibility(
        self, 
        user_profile: UserProfileRequest, 
        competition: Competition
    ) -> float:
        """Calculate age compatibility score (0.0-1.0)."""
        if not user_profile.age or not competition.target_age_min or not competition.target_age_max:
            return 0.5  # Neutral score if data is missing
        
        user_age = user_profile.age
        min_age = competition.target_age_min
        max_age = competition.target_age_max
        
        # Perfect match if user age is within target range
        if min_age <= user_age <= max_age:
            return 1.0
        
        # Calculate distance from target range
        if user_age < min_age:
            distance = min_age - user_age
        else:
            distance = user_age - max_age
        
        # Score decreases with distance, but not too harshly
        if distance <= 2:
            return 0.8
        elif distance <= 4:
            return 0.6
        elif distance <= 6:
            return 0.4
        else:
            return 0.2
    
    def _calculate_grade_compatibility(
        self, 
        user_profile: UserProfileRequest, 
        competition: Competition
    ) -> float:
        """Calculate grade level compatibility score (0.0-1.0)."""
        if not user_profile.grade or not competition.required_grade_min or not competition.required_grade_max:
            return 0.5  # Neutral score if data is missing
        
        user_grade = user_profile.grade
        min_grade = competition.required_grade_min
        max_grade = competition.required_grade_max
        
        # Perfect match if user grade is within required range
        if min_grade <= user_grade <= max_grade:
            return 1.0
        
        # Calculate distance from required range
        if user_grade < min_grade:
            distance = min_grade - user_grade
        else:
            distance = user_grade - max_grade
        
        # Score decreases with distance
        if distance <= 1:
            return 0.8
        elif distance <= 2:
            return 0.6
        elif distance <= 3:
            return 0.4
        else:
            return 0.2
    
    def _calculate_subject_interest_match(
        self, 
        user_profile: UserProfileRequest, 
        competition: Competition
    ) -> float:
        """Calculate subject interest match score (0.0-1.0)."""
        if not user_profile.interests or not competition.subject_areas:
            return 0.3  # Low score if data is missing
        
        user_interests = [interest.lower().strip() for interest in user_profile.interests]
        competition_subjects = [subject.strip().lower() for subject in competition.subject_areas.split(',')]
        
        # Check for direct matches
        direct_matches = set(user_interests) & set(competition_subjects)
        if direct_matches:
            return min(1.0, len(direct_matches) * 0.4)
        
        # Check for keyword matches
        keyword_matches = 0
        for user_interest in user_interests:
            for subject, keywords in self.subject_keywords.items():
                if any(keyword in user_interest for keyword in keywords):
                    keyword_matches += 1
                    break
        
        # Check if competition subjects match user interest keywords
        for subject in competition_subjects:
            for interest_keywords in self.subject_keywords.values():
                if any(keyword in subject for keyword in interest_keywords):
                    keyword_matches += 1
                    break
        
        # Normalize keyword matches
        if keyword_matches > 0:
            return min(1.0, keyword_matches * 0.3)
        
        return 0.1  # Very low score if no matches
    
    def _calculate_location_preference(
        self, 
        user_profile: UserProfileRequest, 
        competition: Competition
    ) -> float:
        """Calculate location preference score (0.0-1.0)."""
        if not user_profile.location_preference:
            return 0.5  # Neutral score if no preference
        
        user_location = user_profile.location_preference.lower()
        competition_location = competition.location.lower()
        
        # Exact location match
        if user_location in competition_location or competition_location in user_location:
            return 1.0
        
        # Remote competition preference
        if user_location == "remote" and "online" in competition_location:
            return 1.0
        
        # Regional matches (simplified)
        if any(region in user_location for region in ["local", "regional"]) and competition.scale in [CompetitionScale.LOCAL, CompetitionScale.REGIONAL]:
            return 0.8
        
        if "national" in user_location and competition.scale == CompetitionScale.NATIONAL:
            return 0.8
        
        if "international" in user_location and competition.scale == CompetitionScale.INTERNATIONAL:
            return 0.8
        
        return 0.3  # Low score for no match
    
    def _calculate_scale_preference(
        self, 
        user_profile: UserProfileRequest, 
        competition: Competition
    ) -> float:
        """Calculate competition scale preference score (0.0-1.0)."""
        if not user_profile.preferred_scale:
            return 0.5  # Neutral score if no preference
        
        user_scales = [scale.lower() for scale in user_profile.preferred_scale]
        competition_scale = competition.scale.value
        
        # Direct scale match
        if competition_scale in user_scales:
            return 1.0
        
        # Scale hierarchy (local < regional < national < international)
        scale_hierarchy = {
            CompetitionScale.LOCAL: 1,
            CompetitionScale.REGIONAL: 2,
            CompetitionScale.NATIONAL: 3,
            CompetitionScale.INTERNATIONAL: 4
        }
        
        # Find closest scale preference
        competition_level = scale_hierarchy.get(competition.scale, 2)
        user_levels = [scale_hierarchy.get(scale, 2) for scale in user_scales]
        
        min_distance = min(abs(competition_level - user_level) for user_level in user_levels)
        
        if min_distance == 0:
            return 1.0
        elif min_distance == 1:
            return 0.7
        elif min_distance == 2:
            return 0.4
        else:
            return 0.2
    
    def _calculate_deadline_urgency(self, competition: Competition) -> float:
        """Calculate deadline urgency score (0.0-1.0)."""
        today = date.today()
        days_until_deadline = (competition.registration_deadline - today).days
        
        if days_until_deadline < 0:
            return 0.0  # Past deadline
        elif days_until_deadline <= 7:
            return 1.0  # Very urgent
        elif days_until_deadline <= 30:
            return 0.8  # Urgent
        elif days_until_deadline <= 90:
            return 0.6  # Moderate urgency
        elif days_until_deadline <= 180:
            return 0.4  # Low urgency
        else:
            return 0.2  # Very low urgency
    
    def _generate_match_reasons(
        self, 
        user_profile: UserProfileRequest, 
        competition: Competition,
        scores: Dict[str, float]
    ) -> List[str]:
        """Generate human-readable reasons for the match."""
        reasons = []
        
        # Age compatibility reasons
        if scores["age_score"] >= 0.8:
            if user_profile.age and competition.target_age_min and competition.target_age_max:
                reasons.append(f"Perfect for your age group ({competition.target_age_min}-{competition.target_age_max} years)")
        elif scores["age_score"] >= 0.6:
            reasons.append("Suitable for your age range")
        
        # Grade compatibility reasons
        if scores["grade_score"] >= 0.8:
            if user_profile.grade and competition.required_grade_min and competition.required_grade_max:
                reasons.append(f"Designed for your grade level ({competition.required_grade_min}-{competition.required_grade_max})")
        elif scores["grade_score"] >= 0.6:
            reasons.append("Appropriate for your academic level")
        
        # Subject interest reasons
        if scores["subject_score"] >= 0.8:
            if user_profile.interests and competition.subject_areas:
                matching_interests = [interest for interest in user_profile.interests 
                                    if any(interest.lower() in subject.lower() 
                                          for subject in competition.subject_areas.split(','))]
                if matching_interests:
                    reasons.append(f"Matches your interests in {', '.join(matching_interests[:2])}")
        elif scores["subject_score"] >= 0.6:
            reasons.append("Related to your areas of interest")
        
        # Location reasons
        if scores["location_score"] >= 0.8:
            if user_profile.location_preference:
                reasons.append(f"Located in your preferred area ({user_profile.location_preference})")
        elif scores["location_score"] >= 0.6:
            reasons.append("Convenient location for you")
        
        # Scale reasons
        if scores["scale_score"] >= 0.8:
            reasons.append(f"Perfect {competition.scale.value} competition scale")
        elif scores["scale_score"] >= 0.6:
            reasons.append(f"Good {competition.scale.value} level opportunity")
        
        # Urgency reasons
        if scores["urgency_score"] >= 0.8:
            days_left = (competition.registration_deadline - date.today()).days
            reasons.append(f"Registration closes soon ({days_left} days left)")
        elif scores["urgency_score"] >= 0.6:
            reasons.append("Registration deadline approaching")
        
        # Fallback reasons if no specific matches
        if not reasons:
            reasons.append("Interesting science competition opportunity")
            if competition.is_featured:
                reasons.append("Featured competition with high priority")
        
        return reasons[:3]  # Limit to top 3 reasons
    
    def _calculate_confidence(self, scores: List[float]) -> float:
        """Calculate confidence in the recommendation based on score consistency."""
        if not scores:
            return 0.5
        
        # Higher confidence if scores are consistent and high
        avg_score = sum(scores) / len(scores)
        variance = sum((score - avg_score) ** 2 for score in scores) / len(scores)
        
        # Confidence increases with average score and decreases with variance
        confidence = avg_score * (1 - variance * 0.5)
        return max(0.1, min(1.0, confidence))
    
    def _generate_profile_summary(self, user_profile: UserProfileRequest) -> str:
        """Generate a summary of the user profile used for recommendations."""
        summary_parts = []
        
        if user_profile.age:
            summary_parts.append(f"Age: {user_profile.age}")
        
        if user_profile.grade:
            summary_parts.append(f"Grade: {user_profile.grade}")
        
        if user_profile.interests:
            summary_parts.append(f"Interests: {', '.join(user_profile.interests[:3])}")
        
        if user_profile.location_preference:
            summary_parts.append(f"Location: {user_profile.location_preference}")
        
        if user_profile.preferred_scale:
            summary_parts.append(f"Scale: {', '.join(user_profile.preferred_scale)}")
        
        return " | ".join(summary_parts) if summary_parts else "Basic profile information"
    
    async def _generate_recommendation_stats(
        self,
        user_profile: UserProfileRequest,
        all_competitions: List[Competition],
        recommendations: List[CompetitionRecommendation]
    ) -> RecommendationStats:
        """Generate statistics about the recommendation process."""
        if not recommendations:
            return RecommendationStats(
                average_match_score=0.0,
                score_distribution={},
                top_matching_criteria=[],
                recommendation_quality="low"
            )
        
        # Calculate average match score
        avg_score = sum(rec.match_score for rec in recommendations) / len(recommendations)
        
        # Score distribution
        score_ranges = {"excellent": 0, "good": 0, "fair": 0, "poor": 0}
        for rec in recommendations:
            if rec.match_score >= 0.8:
                score_ranges["excellent"] += 1
            elif rec.match_score >= 0.6:
                score_ranges["good"] += 1
            elif rec.match_score >= 0.4:
                score_ranges["fair"] += 1
            else:
                score_ranges["poor"] += 1
        
        # Determine top matching criteria
        criteria_scores = {
            "age": sum(rec.match_score for rec in recommendations if any("age" in reason.lower() for reason in rec.match_reasons)),
            "grade": sum(rec.match_score for rec in recommendations if any("grade" in reason.lower() for reason in rec.match_reasons)),
            "interests": sum(rec.match_score for rec in recommendations if any("interest" in reason.lower() for reason in rec.match_reasons)),
            "location": sum(rec.match_score for rec in recommendations if any("location" in reason.lower() for reason in rec.match_reasons))
        }
        
        top_criteria = sorted(criteria_scores.items(), key=lambda x: x[1], reverse=True)[:2]
        top_matching_criteria = [criteria[0] for criteria in top_criteria]
        
        # Determine recommendation quality
        if avg_score >= 0.8:
            quality = "excellent"
        elif avg_score >= 0.6:
            quality = "good"
        elif avg_score >= 0.4:
            quality = "fair"
        else:
            quality = "poor"
        
        return RecommendationStats(
            average_match_score=round(avg_score, 3),
            score_distribution=score_ranges,
            top_matching_criteria=top_matching_criteria,
            recommendation_quality=quality
        )

# Global instance for dependency injection
ai_recommendation_service = AIRecommendationService() 