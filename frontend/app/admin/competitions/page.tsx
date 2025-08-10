'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { competitionsAPI, Competition } from '../../api/competitions';
import EditCompetitionForm from '../../../components/edit-competition-form';

export default function AdminCompetitionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [totalCompetitions, setTotalCompetitions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState({
    format: '',
    scale: '',
    is_approved: '',
    is_featured: '',
    is_active: '',
    search: '',
  });
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);

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

    fetchCompetitions();
  }, [user, router, currentPage, filters]);

  const fetchCompetitions = async () => {
    setIsLoading(true);
    try {
      const skip = (currentPage - 1) * limit;
      const params: any = {
        skip,
        limit,
      };

      if (filters.format) params.format = filters.format;
      if (filters.scale) params.scale = filters.scale;
      if (filters.search) params.search = filters.search;

      const response = await competitionsAPI.getCompetitions(params);
      let filteredCompetitions = response.competitions;

      // Apply additional filters that aren't supported by the API
      if (filters.is_approved !== '') {
        filteredCompetitions = filteredCompetitions.filter(
          comp => comp.is_approved === (filters.is_approved === 'true')
        );
      }
      if (filters.is_featured !== '') {
        filteredCompetitions = filteredCompetitions.filter(
          comp => comp.is_featured === (filters.is_featured === 'true')
        );
      }
      if (filters.is_active !== '') {
        filteredCompetitions = filteredCompetitions.filter(
          comp => comp.is_active === (filters.is_active === 'true')
        );
      }

      setCompetitions(filteredCompetitions);
      setTotalCompetitions(filteredCompetitions.length);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      alert('Failed to fetch competitions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureToggle = async (competitionId: string, isFeatured: boolean, competitionTitle: string) => {
    const action = isFeatured ? 'unfeature' : 'feature';
    if (!confirm(`Are you sure you want to ${action} "${competitionTitle}"?`)) {
      return;
    }

    setIsActionLoading(true);
    try {
      if (isFeatured) {
        await competitionsAPI.unfeatureCompetition(competitionId);
        alert('Competition unfeatured successfully!');
      } else {
        await competitionsAPI.featureCompetition(competitionId);
        alert('Competition featured successfully!');
      }
      fetchCompetitions();
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
      fetchCompetitions();
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
      fetchCompetitions();
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleEditCompetition = (competition: Competition) => {
    setEditingCompetition(competition);
    setIsEditFormOpen(true);
  };

  const handleUpdateCompetition = (updatedCompetition: Competition) => {
    // Update the competition in the local state
    setCompetitions(prev =>
      prev.map(comp =>
        comp.id === updatedCompetition.id ? updatedCompetition : comp
      )
    );
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Competition Management</h1>
              <p className="text-gray-600">Manage all competitions on the platform</p>
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search competitions..."
              />
            </div>

            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <select
                id="format"
                value={filters.format}
                onChange={(e) => handleFilterChange('format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Formats</option>
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>

            <div>
              <label htmlFor="scale" className="block text-sm font-medium text-gray-700 mb-1">
                Scale
              </label>
              <select
                id="scale"
                value={filters.scale}
                onChange={(e) => handleFilterChange('scale', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Scales</option>
                <option value="PROVINCIAL">Provincial</option>
                <option value="REGIONAL">Regional</option>
                <option value="INTERNATIONAL">International</option>
              </select>
            </div>

            <div>
              <label htmlFor="approved" className="block text-sm font-medium text-gray-700 mb-1">
                Approval Status
              </label>
              <select
                id="approved"
                value={filters.is_approved}
                onChange={(e) => handleFilterChange('is_approved', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="true">Approved</option>
                <option value="false">Not Approved</option>
              </select>
            </div>

            <div>
              <label htmlFor="featured" className="block text-sm font-medium text-gray-700 mb-1">
                Featured Status
              </label>
              <select
                id="featured"
                value={filters.is_featured}
                onChange={(e) => handleFilterChange('is_featured', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="true">Featured</option>
                <option value="false">Not Featured</option>
              </select>
            </div>

            <div>
              <label htmlFor="active" className="block text-sm font-medium text-gray-700 mb-1">
                Active Status
              </label>
              <select
                id="active"
                value={filters.is_active}
                onChange={(e) => handleFilterChange('is_active', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Competitions Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Competitions ({totalCompetitions} total)
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading competitions...</p>
            </div>
          ) : competitions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500">No competitions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Competition
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Format & Scale
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {competitions.map((competition) => (
                      <tr key={competition.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{competition.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-2">{competition.introduction}</div>
                            <div className="text-sm text-gray-500">{competition.location}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              competition.is_approved
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {competition.is_approved ? 'Approved' : 'Pending'}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              competition.is_featured
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {competition.is_featured ? 'Featured' : 'Not Featured'}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              competition.is_active
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {competition.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="capitalize">{competition.format.toLowerCase()}</div>
                            <div className="capitalize">{competition.scale.toLowerCase()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(competition.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col gap-2">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditCompetition(competition)}
                              disabled={isActionLoading}
                              className="text-sm px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
                            >
                              Edit
                            </button>

                            {/* Feature/Unfeature Button */}
                            <button
                              onClick={() => handleFeatureToggle(competition.id, competition.is_featured, competition.title)}
                              disabled={isActionLoading}
                              className={`text-sm px-3 py-1 rounded ${
                                competition.is_featured
                                  ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                            >
                              {competition.is_featured ? 'Unfeature' : 'Feature'}
                            </button>

                            {/* Activate/Deactivate Button */}
                            <button
                              onClick={() => handleActivateToggle(competition.id, competition.is_active, competition.title)}
                              disabled={isActionLoading}
                              className={`text-sm px-3 py-1 rounded ${
                                competition.is_active
                                  ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                            >
                              {competition.is_active ? 'Deactivate' : 'Activate'}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteCompetition(competition.id, competition.title)}
                              disabled={isActionLoading}
                              className="text-sm px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

      {/* Edit Competition Form Modal */}
      <EditCompetitionForm
        isOpen={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setEditingCompetition(null);
        }}
        competition={editingCompetition}
        onUpdate={handleUpdateCompetition}
        isLoading={false}
      />
    </main>
  );
}
