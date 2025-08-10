'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersAPI, UserListResponse, UserDetailResponse } from '../../api/users';

interface UserDetailModalProps {
  user: UserDetailResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (userId: string, data: any) => Promise<void>;
}

const UserDetailModal = ({ user, isOpen, onClose, onUpdate }: UserDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    organization: '',
    phone_number: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        organization: user.organization || '',
        phone_number: user.phone_number || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      await onUpdate(user.id, formData);
      setIsEditing(false);
      alert('User information updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      if (error instanceof Error) {
        alert(`Failed to update user: ${error.message}`);
      } else {
        alert('Failed to update user. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1234567890"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user.organization || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user.phone_number || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.role === 'ADMIN' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {new Date(user.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {new Date(user.updated_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit User
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserListResponse[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetailResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState({
    role: '',
    is_active: '',
    search: '',
  });

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

    fetchUsers();
  }, [user, router, currentPage, filters]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const skip = (currentPage - 1) * limit;
      const params: any = {
        skip,
        limit,
      };

      if (filters.role) params.role = filters.role;
      if (filters.is_active !== '') params.is_active = filters.is_active === 'true';
      if (filters.search) params.search = filters.search;

      const response = await usersAPI.getUsers(params);
      setUsers(response.users);
      setTotalUsers(response.total);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUser = async (userId: string) => {
    try {
      // Try to get user details from API if available
      try {
        const userDetail = await usersAPI.getUserById(userId);
        setSelectedUser(userDetail);
        setIsModalOpen(true);
      } catch (apiError) {
        // Fallback to mock data if API endpoint doesn't exist yet
        console.log('API endpoint not available, using mock data:', apiError);
        const userDetail: UserDetailResponse = {
          id: userId,
          email: users.find(u => u.id === userId)?.email || '',
          full_name: users.find(u => u.id === userId)?.full_name || '',
          organization: users.find(u => u.id === userId)?.organization,
          phone_number: '', // This would come from the API
          role: users.find(u => u.id === userId)?.role || 'CREATOR',
          is_active: users.find(u => u.id === userId)?.is_active || false,
          created_at: users.find(u => u.id === userId)?.created_at || '',
          updated_at: new Date().toISOString(), // This would come from the API
        };
        
        setSelectedUser(userDetail);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Failed to fetch user details. Please try again.');
    }
  };

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      // Try to update user via API if available
      await usersAPI.updateUser(userId, data);
      alert('User information updated successfully!');
      fetchUsers(); // Refresh the list
    } catch (error) {
      // Fallback message if API endpoint doesn't exist yet
      console.log('API endpoint not available:', error);
      alert('User editing functionality requires backend support. The API endpoint for updating other users is not yet implemented.');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    setIsActionLoading(true);
    try {
      await usersAPI.deleteUser(userId);
      alert('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      if (error instanceof Error) {
        alert(`Failed to delete user: ${error.message}`);
      } else {
        alert('Failed to delete user. Please try again.');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean, userName: string) => {
    const action = isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} user "${userName}"?`)) {
      return;
    }

    setIsActionLoading(true);
    try {
      if (isActive) {
        await usersAPI.deactivateUser(userId);
        alert('User deactivated successfully!');
      } else {
        await usersAPI.activateUser(userId);
        alert('User activated successfully!');
      }
      fetchUsers();
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      if (error instanceof Error) {
        alert(`Failed to ${action} user: ${error.message}`);
      } else {
        alert(`Failed to ${action} user. Please try again.`);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, currentRole: string, userName: string) => {
    const newRole = currentRole === 'ADMIN' ? 'CREATOR' : 'ADMIN';
    if (!confirm(`Are you sure you want to change "${userName}" role from ${currentRole} to ${newRole}?`)) {
      return;
    }

    setIsActionLoading(true);
    try {
      await usersAPI.changeUserRole(userId, newRole as 'ADMIN' | 'CREATOR');
      alert(`User role changed to ${newRole} successfully!`);
      fetchUsers();
    } catch (error) {
      console.error('Error changing user role:', error);
      if (error instanceof Error) {
        alert(`Failed to change user role: ${error.message}`);
      } else {
        alert('Failed to change user role. Please try again.');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalUsers / limit);

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600">Manage users, roles, and permissions</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                placeholder="Search by name or email..."
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="CREATOR">Creator</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={filters.is_active}
                onChange={(e) => handleFilterChange('is_active', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchUsers}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Loading...' : 'Apply Filters'}
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Users ({totalUsers} total)
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                    {users.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{userItem.full_name}</div>
                            <div className="text-sm text-gray-500">{userItem.email}</div>
                            {userItem.organization && (
                              <div className="text-sm text-gray-500">{userItem.organization}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userItem.role === 'ADMIN' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {userItem.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userItem.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {userItem.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(userItem.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {/* View Details Button */}
                            <button
                              onClick={() => handleViewUser(userItem.id)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="View user details"
                            >
                              View
                            </button>

                            {/* Change Role Button */}
                            <button
                              onClick={() => handleChangeRole(userItem.id, userItem.role, userItem.full_name)}
                              disabled={isActionLoading || userItem.id === user?.id}
                              className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                              title={userItem.id === user?.id ? "Cannot change your own role" : `Change to ${userItem.role === 'ADMIN' ? 'CREATOR' : 'ADMIN'}`}
                            >
                              {userItem.role === 'ADMIN' ? 'Make Creator' : 'Make Admin'}
                            </button>

                            {/* Toggle Status Button */}
                            <button
                              onClick={() => handleToggleUserStatus(userItem.id, userItem.is_active, userItem.full_name)}
                              disabled={isActionLoading || userItem.id === user?.id}
                              className={`${
                                userItem.is_active 
                                  ? 'text-orange-600 hover:text-orange-900' 
                                  : 'text-green-600 hover:text-green-900'
                              } disabled:text-gray-400 disabled:cursor-not-allowed`}
                              title={userItem.id === user?.id ? "Cannot deactivate yourself" : (userItem.is_active ? 'Deactivate' : 'Activate')}
                            >
                              {userItem.is_active ? 'Deactivate' : 'Activate'}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteUser(userItem.id, userItem.full_name)}
                              disabled={isActionLoading || userItem.id === user?.id}
                              className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                              title={userItem.id === user?.id ? "Cannot delete yourself" : "Delete user"}
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
                      Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalUsers)} of {totalUsers} results
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

        {/* User Detail Modal */}
        <UserDetailModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onUpdate={handleUpdateUser}
        />
      </div>
    </main>
  );
}
