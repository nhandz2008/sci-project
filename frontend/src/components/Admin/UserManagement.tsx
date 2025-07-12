import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Shield, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  MoreHorizontal,
  Eye,
  EyeOff
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { userAPI } from '@/client/api'
import { User, UserCreate, UserUpdate, UserRole } from '@/types'
import { cn } from '@/utils'

// Validation schema for user form
const userSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  password: yup
    .string()
    .optional()
    .test('password-required', 'Password is required for new users', function(value) {
      const isEdit = this.parent.id // If editing, password is optional
      return isEdit || !!value
    })
    .test('password-strength', 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number', function(value) {
      if (!value) return true // Let required test handle empty values
      const hasMinLength = value.length >= 8
      const hasStrength = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)
      return hasMinLength && hasStrength
    }),
  role: yup.string().required('Role is required'),
  is_active: yup.boolean(),
})

type UserFormData = yup.InferType<typeof userSchema>

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  user?: User | null
  onSuccess: () => void
}

// Helper function to get form default values
const getFormDefaultValues = (user: User | null | undefined): UserFormData => {
  if (!user) {
    return {
      username: '',
      email: '',
      password: '',
      role: UserRole.CREATOR,
      is_active: true,
    }
  }

  return {
    username: user.username || '',
    email: user.email || '',
    password: '', // Always empty for edits
    role: user.role || UserRole.CREATOR,
    is_active: user.is_active !== undefined ? user.is_active : true,
  }
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, user, onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<UserFormData>({
    resolver: yupResolver(userSchema),
    defaultValues: getFormDefaultValues(user),
  })

  // Reset form when user data changes
  useEffect(() => {
    reset(getFormDefaultValues(user))
  }, [user, reset])

  const createMutation = useMutation({
    mutationFn: userAPI.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onSuccess()
      reset()
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Failed to create user'
      if (detail.includes('email already exists')) {
        setError('email', { message: 'This email is already registered' })
      } else if (detail.includes('username already taken')) {
        setError('username', { message: 'This username is already taken' })
      } else {
        setError('root', { message: detail })
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) => userAPI.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onSuccess()
      reset()
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Failed to update user'
      setError('root', { message: detail })
    },
  })

  const onSubmit = (data: UserFormData) => {
    const userData: UserCreate | UserUpdate = {
      username: data.username,
      email: data.email,
      role: data.role as UserRole,
      is_active: data.is_active,
    }

    if (data.password) {
      userData.password = data.password
    }

    if (user) {
      updateMutation.mutate({ id: user.id, data: userData })
    } else {
      createMutation.mutate(userData as UserCreate)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-card rounded-lg border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {user ? 'Edit User' : 'Create New User'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              {...register('username')}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                errors.username ? 'border-red-500' : 'border-border'
              )}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                errors.email ? 'border-red-500' : 'border-border'
              )}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password {user && <span className="text-muted-foreground">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={cn(
                  'w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  errors.password ? 'border-red-500' : 'border-border'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Role Field */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2">
              Role
            </label>
            <select
              id="role"
              {...register('role')}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                errors.role ? 'border-red-500' : 'border-border'
              )}
            >
              <option value={UserRole.CREATOR}>Creator</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
            {errors.role && (
              <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              {...register('is_active')}
              className="h-4 w-4 text-primary border-border rounded focus:ring-primary"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Active Account
            </label>
          </div>

          {/* General Error */}
          {errors.root && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{errors.root.message}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-outline py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 btn-primary py-2 px-4 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : user
                ? 'Update User'
                : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const UserManagement: React.FC = () => {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [activeFilter, setActiveFilter] = useState<boolean | ''>('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const queryClient = useQueryClient()

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', { search, roleFilter, activeFilter, page, pageSize }],
    queryFn: () => userAPI.getAllUsers({
      skip: (page - 1) * pageSize,
      limit: pageSize,
      search: search || undefined,
      role: roleFilter || undefined,
      is_active: activeFilter !== '' ? activeFilter : undefined,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: userAPI.getUserStatistics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const deleteMutation = useMutation({
    mutationFn: userAPI.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['userStats'] })
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to delete user')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, activate }: { id: number; activate: boolean }) => 
      activate ? userAPI.activateUser(id) : userAPI.deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['userStats'] })
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to update user status')
    },
  })

  const handleCreateUser = () => {
    setSelectedUser(null)
    setShowUserModal(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      deleteMutation.mutate(user.id)
    }
  }

  const handleToggleActive = (user: User) => {
    toggleActiveMutation.mutate({ id: user.id, activate: !user.is_active })
  }

  const totalPages = usersData ? usersData.pages : 0
  const hasNextPage = page < totalPages
  const hasPreviousPage = page > 1

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage users and their permissions
          </p>
        </div>
        <button
          onClick={handleCreateUser}
          className="btn-primary px-4 py-2 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* User Statistics */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Total Users</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{userStats.total_users}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold">Active Users</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{userStats.active_users}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Admins</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{userStats.admin_count}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold">Creators</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{userStats.creator_count}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline px-4 py-2 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">All Roles</option>
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.CREATOR}>Creator</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={activeFilter.toString()}
                onChange={(e) => setActiveFilter(e.target.value === '' ? '' : e.target.value === 'true')}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">User</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Role</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Created</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Loading users...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-red-500">
                    <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                    Failed to load users
                  </td>
                </tr>
              ) : usersData?.users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                usersData?.users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        user.role === UserRole.ADMIN
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-orange-100 text-orange-800'
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      )}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1 hover:bg-muted rounded"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className="p-1 hover:bg-muted rounded"
                          title={user.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {user.is_active ? (
                            <UserX className="w-4 h-4 text-red-500" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-green-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-1 hover:bg-muted rounded text-red-500"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {usersData && usersData.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, usersData.total)} of {usersData.total} users
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!hasPreviousPage}
                className="btn-outline px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasNextPage}
                className="btn-outline px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        user={selectedUser}
        onSuccess={() => setShowUserModal(false)}
      />
    </div>
  )
} 