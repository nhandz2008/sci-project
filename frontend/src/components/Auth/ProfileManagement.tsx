import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle, 
  Shield,
  Mail,
  Calendar
} from 'lucide-react'
import { userAPI } from '@/client/api'
import { UserUpdate, UserRole } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils'

// Validation schema for profile update
const profileSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  currentPassword: yup
    .string()
    .optional(),
  newPassword: yup
    .string()
    .optional()
    .test('password-strength', 'Password must be at least 8 characters and contain uppercase, lowercase, and number', function(value) {
      if (!value) return true // Optional field
      return value.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)
    }),
  confirmPassword: yup
    .string()
    .optional()
    .test('passwords-match', 'Passwords must match', function(value) {
      const { newPassword } = this.parent
      if (newPassword && !value) return false
      if (newPassword && value !== newPassword) return false
      return true
    }),
})

type ProfileFormData = yup.InferType<typeof profileSchema>

export const ProfileManagement: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userAPI.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    clearErrors,
    watch,
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      username: profile?.username || '',
      email: profile?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  // Reset form when profile data loads
  React.useEffect(() => {
    if (profile) {
      reset({
        username: profile.username,
        email: profile.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    }
  }, [profile, reset])

  const updateMutation = useMutation({
    mutationFn: (data: UserUpdate) => userAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      setIsEditing(false)
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 3000)
      reset({
        username: profile?.username || '',
        email: profile?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Failed to update profile'
      if (detail.includes('email already in use')) {
        setError('email', { message: 'This email is already in use by another account' })
      } else if (detail.includes('username already taken')) {
        setError('username', { message: 'This username is already taken' })
      } else if (detail.includes('current password')) {
        setError('currentPassword', { message: 'Current password is incorrect' })
      } else {
        setError('root', { message: detail })
      }
    },
  })

  const newPassword = watch('newPassword')

  const onSubmit = (data: ProfileFormData) => {
    const updateData: UserUpdate = {
      username: data.username,
      email: data.email,
    }

    // Only include password if user wants to change it
    if (data.newPassword) {
      if (!data.currentPassword) {
        setError('currentPassword', { message: 'Current password is required to set a new password' })
        return
      }
      updateData.password = data.newPassword
    }

    updateMutation.mutate(updateData)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    clearErrors()
    reset({
      username: profile?.username || '',
      email: profile?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account information
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary px-4 py-2 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Success Message */}
      {updateSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">Profile updated successfully!</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Overview */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{profile.username}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  {profile.role === UserRole.ADMIN ? 'Administrator' : 'Creator'}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              {...register('username')}
              disabled={!isEditing}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                !isEditing && 'bg-muted cursor-not-allowed',
                errors.username ? 'border-red-500' : 'border-border'
              )}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.username.message}
              </p>
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
              disabled={!isEditing}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                !isEditing && 'bg-muted cursor-not-allowed',
                errors.email ? 'border-red-500' : 'border-border'
              )}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Change Section */}
          {isEditing && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Leave blank to keep your current password
              </p>

              {/* Current Password */}
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...register('currentPassword')}
                    placeholder={newPassword ? 'Required for password change' : 'Enter current password'}
                    className={cn(
                      'w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                      errors.currentPassword ? 'border-red-500' : 'border-border'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    {...register('newPassword')}
                    placeholder="Enter new password"
                    className={cn(
                      'w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                      errors.newPassword ? 'border-red-500' : 'border-border'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    placeholder="Confirm new password"
                    className={cn(
                      'w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                      errors.confirmPassword ? 'border-red-500' : 'border-border'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* General Error */}
          {errors.root && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.root.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 btn-outline py-2 px-4 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 btn-primary py-2 px-4 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
} 