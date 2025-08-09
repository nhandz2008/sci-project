'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { competitionsAPI, Competition } from '../../api/competitions';

export default function AdminFeaturedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [totalCompetitions, setTotalCompetitions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'ADMIN') {
      router.push('/account');
      return;
    }

    fetchFeaturedCompetitions();
  }, [user, router, currentPage]);

  const fetchFeaturedCompetitions = async () => {
    setIsLoading(true);
    try {
      const skip = (currentPage - 1) * limit;
      const response = await competitionsAPI.getFeaturedCompetitions({
        skip,
        limit,
      });
      setCompetitions(response.competitions);
      setTotalCompetitions(response.total);
    } catch (error) {
      console.error('Error fetching featured competitions:', error);
      alert('Failed to fetch featured competitions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfeatureCompetition = async (competitionId: string, competitionTitle: string) => {
    if (!confirm(`Are you sure you want to unfeature "${competitionTitle}"?`)) {
      return;
    }

    setIsActionLoading(true);
    try {
      await competitionsAPI.unfeatureCompetition(competitionId);
      alert('Competition unfeatured successfully!');
      fetchFeaturedCompetitions();
    } catch (error) {
      console.error('Error unfeaturing competition:', error);
      if (error instanceof Error) {
        alert(`Failed to unfeature competition: ${error.message}`);
      } else {
        alert('Failed to unfeature competition. Please try again.');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleActivateToggle = async (competitionId: string, isActive: boolean, competitionTitle: string) => {
    const action = isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} "${competitionTitle}"?`)) {
      return;
    }

    setIsActionLoading(true);
    try {
      if (isActive) {
        await competitionsAPI.deactivateCompetition(competitionId);
        alert('Competition deactivated successfully!');
      } else {
        await competitionsAPI.activateCompetition(competitionId);
        alert('Competition activated successfully!');
      }
      fetchFeaturedCompetitions();
    } catch (error) {
      console.error(`Error ${action}ing competition:`, error);
      if (error instanceof Error) {
        alert(`Failed to ${action} competition: ${error.message}`);
      } else {
        alert(`Failed to ${action} competition. Please try again.`);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteCompetition = async (competitionId: string, competitionTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${competitionTitle}"? This action cannot be undone.`)) {
      return;
    }

    setIsActionLoading(true);
    try {
      await competitionsAPI.deleteCompetition(competitionId);
      alert('Competition deleted successfully!');
      fetchFeaturedCompetitions();
    } catch (error) {
      console.error('Error deleting competition:', error);
      if (error instanceof Error) {
        alert(`Failed to delete competition: ${error.message}`);
      } else {
        alert('Failed to delete competition. Please try again.');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCompetitions / limit);

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Featured Competitions</h1>
              <p className="text-gray-600">Manage featured competitions on the platform</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Featured Competitions List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Featured Competitions ({totalCompetitions} total)
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading featured competitions...</p>
            </div>
          ) : competitions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-2">No featured competitions</p>
              <p className="text-sm text-gray-400">Start featuring competitions to highlight them on the platform</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {competitions.map((competition) => (
                  <div key={competition.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{competition.title}</h3>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Featured
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            competition.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {competition.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">{competition.introduction}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Location:</span>
                            <span className="text-gray-600 ml-1">{competition.location}</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Format:</span>
                            <span className="text-gray-600 ml-1 capitalize">{competition.format.toLowerCase()}</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Scale:</span>
                            <span className="text-gray-600 ml-1 capitalize">{competition.scale.toLowerCase()}</span>
                          </div>
                        </div>

                        {competition.registration_deadline && (
                          <div className="text-sm mb-4">
                            <span className="font-medium text-gray-700">Registration Deadline:</span>
                            <span className="text-gray-600 ml-1">
                              {new Date(competition.registration_deadline).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Created: {new Date(competition.created_at).toLocaleDateString()}</span>
                          {competition.owner_id && <span>Owner ID: {competition.owner_id}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleUnfeatureCompetition(competition.id, competition.title)}
                          disabled={isActionLoading}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Unfeature
                        </button>
                        <button
                          onClick={() => handleActivateToggle(competition.id, competition.is_active, competition.title)}
                          disabled={isActionLoading}
                          className={`px-4 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${
                            competition.is_active
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {competition.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteCompetition(competition.id, competition.title)}
                          disabled={isActionLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCompetitions)} of {totalCompetitions} results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/competitions"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage All Competitions
            </Link>
            <Link
              href="/admin/pending"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Review Pending
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
