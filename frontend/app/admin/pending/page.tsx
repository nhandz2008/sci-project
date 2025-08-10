'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { competitionsAPI, Competition } from '../../api/competitions';

export default function AdminPendingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [totalCompetitions, setTotalCompetitions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);

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

    fetchPendingCompetitions();
  }, [user, router, currentPage]);

  const fetchPendingCompetitions = async () => {
    setIsLoading(true);
    try {
      const skip = (currentPage - 1) * limit;
      const response = await competitionsAPI.getPendingCompetitions({
        skip,
        limit,
      });
      setCompetitions(response.competitions);
      setTotalCompetitions(response.total);
    } catch (error) {
      console.error('Error fetching pending competitions:', error);
      alert('Failed to fetch pending competitions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveCompetition = async (competitionId: string, competitionTitle: string) => {
    if (!confirm(`Are you sure you want to approve "${competitionTitle}"?`)) {
      return;
    }

    setIsActionLoading(true);
    try {
      await competitionsAPI.approveCompetition(competitionId);
      alert('Competition approved successfully!');
      fetchPendingCompetitions();
    } catch (error) {
      console.error('Error approving competition:', error);
      if (error instanceof Error) {
        alert(`Failed to approve competition: ${error.message}`);
      } else {
        alert('Failed to approve competition. Please try again.');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectCompetition = async (competitionId: string, competitionTitle: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    if (!confirm(`Are you sure you want to reject "${competitionTitle}"?`)) {
      return;
    }

    setIsActionLoading(true);
    try {
      await competitionsAPI.rejectCompetition(competitionId, rejectionReason);
      alert('Competition rejected successfully!');
      setRejectionReason('');
      setSelectedCompetition(null);
      fetchPendingCompetitions();
    } catch (error) {
      console.error('Error rejecting competition:', error);
      if (error instanceof Error) {
        alert(`Failed to reject competition: ${error.message}`);
      } else {
        alert('Failed to reject competition. Please try again.');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const openRejectModal = (competition: Competition) => {
    setSelectedCompetition(competition);
    setRejectionReason('');
  };

  const closeRejectModal = () => {
    setSelectedCompetition(null);
    setRejectionReason('');
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pending Competitions</h1>
              <p className="text-gray-600">Review and approve competitions awaiting moderation</p>
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

        {/* Competitions List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Reviews ({totalCompetitions} total)
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading pending competitions...</p>
            </div>
          ) : competitions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-2">No pending competitions</p>
              <p className="text-sm text-gray-400">All competitions have been reviewed</p>
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
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            Pending Review
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
                          onClick={() => handleApproveCompetition(competition.id, competition.title)}
                          disabled={isActionLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(competition)}
                          disabled={isActionLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Reject
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
      </div>

      {/* Rejection Modal */}
      {selectedCompetition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reject Competition
              </h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting "{selectedCompetition.title}":
              </p>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                placeholder="Enter rejection reason..."
              />

              <div className="flex items-center justify-end gap-4">
                <button
                  onClick={closeRejectModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isActionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRejectCompetition(selectedCompetition.id, selectedCompetition.title)}
                  disabled={isActionLoading || !rejectionReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isActionLoading ? 'Rejecting...' : 'Reject Competition'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
