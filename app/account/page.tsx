'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Competition {
  id: string;
  name: string;
  location: string;
  description: string;
  homepage: string;
}

export default function AccountPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Competition[]>([]);
  const [likedCompetitions, setLikedCompetitions] = useState<Competition[]>([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      // Load avatar from localStorage
      const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
      if (savedAvatar) {
        setAvatar(savedAvatar);
      }

      // Load recently viewed competitions
      const savedRecent = localStorage.getItem(`recently_viewed_${user.id}`);
      if (savedRecent) {
        setRecentlyViewed(JSON.parse(savedRecent));
      }

      // Load liked competitions
      const savedLiked = localStorage.getItem(`liked_competitions_${user.id}`);
      if (savedLiked) {
        setLikedCompetitions(JSON.parse(savedLiked));
      }
    }
  }, [user]);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatar(result);
        
        // Save to localStorage
        localStorage.setItem(`avatar_${user.id}`, result);
        
        // Update user context
        updateUser({ avatar_url: result });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLikedCompetition = (competitionId: string) => {
    if (user) {
      const updatedLiked = likedCompetitions.filter(comp => comp.id !== competitionId);
      setLikedCompetitions(updatedLiked);
      localStorage.setItem(`liked_competitions_${user.id}`, JSON.stringify(updatedLiked));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-6">
            {/* Avatar Section */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt="User avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </label>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.full_name}</h1>
              <p className="text-gray-600 mb-1">{user.email}</p>
              <p className="text-sm text-gray-500">Member since {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recently Viewed Competitions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recently Viewed</h2>
            {recentlyViewed.length > 0 ? (
              <div className="space-y-4">
                {recentlyViewed.slice(0, 5).map((competition) => (
                  <div key={competition.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-1">{competition.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{competition.location}</p>
                    <p className="text-gray-700 text-sm line-clamp-2">{competition.description}</p>
                    <Link
                      href={`/competitions/${competition.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <p className="text-gray-500">No recently viewed competitions</p>
                <Link
                  href="/competitions"
                  className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
                >
                  Browse Competitions
                </Link>
              </div>
            )}
          </div>

          {/* Liked Competitions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Liked Competitions</h2>
            {likedCompetitions.length > 0 ? (
              <div className="space-y-4">
                {likedCompetitions.map((competition) => (
                  <div key={competition.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{competition.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{competition.location}</p>
                        <p className="text-gray-700 text-sm line-clamp-2">{competition.description}</p>
                        <Link
                          href={`/competitions/${competition.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details →
                        </Link>
                      </div>
                      <button
                        onClick={() => removeLikedCompetition(competition.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        aria-label="Remove from liked"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <p className="text-gray-500">No liked competitions yet</p>
                <Link
                  href="/competitions"
                  className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
                >
                  Discover Competitions
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/competitions"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Browse Competitions</h3>
                <p className="text-sm text-gray-600">Discover new opportunities</p>
              </div>
            </Link>

            <Link
              href="/reset-password"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-600">Update your security</p>
              </div>
            </Link>

            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Go Home</h3>
                <p className="text-sm text-gray-600">Return to homepage</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
} 