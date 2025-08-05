'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../app/contexts/AuthContext';

interface LikeButtonProps {
  competitionId: string;
  competition: {
    id: string;
    name: string;
    location: string;
    description: string;
    homepage: string;
  };
}

export default function LikeButton({ competitionId, competition }: LikeButtonProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if competition is liked on mount
  useEffect(() => {
    if (user) {
      const savedLiked = localStorage.getItem(`liked_competitions_${user.id}`);
      if (savedLiked) {
              const likedCompetitions = JSON.parse(savedLiked);
      setIsLiked(likedCompetitions.some((comp: { id: string }) => comp.id === competitionId));
      }
    }
  }, [user, competitionId]);

  const handleLikeToggle = () => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    setIsLoading(true);

    try {
      const savedLiked = localStorage.getItem(`liked_competitions_${user.id}`);
      let likedCompetitions = savedLiked ? JSON.parse(savedLiked) : [];

      if (isLiked) {
        // Remove from liked
        likedCompetitions = likedCompetitions.filter((comp: { id: string }) => comp.id !== competitionId);
      } else {
        // Add to liked
        likedCompetitions.unshift(competition);
      }

      localStorage.setItem(`liked_competitions_${user.id}`, JSON.stringify(likedCompetitions));
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewCompetition = () => {
    if (user) {
      // Add to recently viewed
      const savedRecent = localStorage.getItem(`recently_viewed_${user.id}`);
      let recentlyViewed = savedRecent ? JSON.parse(savedRecent) : [];
      
      // Remove if already exists
      recentlyViewed = recentlyViewed.filter((comp: { id: string }) => comp.id !== competitionId);
      
      // Add to beginning
      recentlyViewed.unshift(competition);
      
      // Keep only last 10
      recentlyViewed = recentlyViewed.slice(0, 10);
      
      localStorage.setItem(`recently_viewed_${user.id}`, JSON.stringify(recentlyViewed));
    }
  };

  return (
    <button
      onClick={handleLikeToggle}
      disabled={isLoading}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white ${
        isLiked
          ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
          : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500 shadow-md'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={isLiked ? 'Unlike competition' : 'Like competition'}
    >
      {isLoading ? (
        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <svg
          className={`w-4 h-4 ${isLiked ? 'fill-current' : 'stroke-current fill-none'}`}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  );
} 