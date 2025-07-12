import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { userAPI } from '@/client/api'
import { User, UserCreate } from '@/types'
import { AlertCircle, Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react'

const registrationSchema = yup.object({
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
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
})

type RegistrationFormData = yup.InferType<typeof registrationSchema>

interface RegisterFormProps {
  onSuccess?: (user: User) => void
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegistrationFormData>({
    resolver: yupResolver(registrationSchema),
  })

  const registrationMutation = useMutation({
    mutationFn: (data: UserCreate) => userAPI.register(data),
    onSuccess: (user) => {
      onSuccess?.(user)
    },
    onError: (error: any) => {
      if (error.response?.status === 400) {
        const detail = error.response.data?.detail || 'Registration failed'
        
        // Handle specific error cases
        if (detail.includes('email already exists')) {
          setError('email', { message: 'This email is already registered' })
        } else if (detail.includes('username already taken')) {
          setError('username', { message: 'This username is already taken' })
        } else {
          setError('root', { message: detail })
        }
      } else {
        setError('root', { message: 'Registration failed. Please try again.' })
      }
    },
  })

  const onSubmit = (data: RegistrationFormData) => {
    const registerData: UserCreate = {
      username: data.username,
      email: data.email,
      password: data.password,
      role: 'creator', // Force creator role for registration
    }

    registrationMutation.mutate(registerData)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Create Your Account</h2>
          <p className="text-muted-foreground mt-2">
            Join our community to share and discover science competitions
          </p>
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
              placeholder="Enter your username"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                errors.username ? 'border-red-500' : 'border-border'
              }`}
              {...register('username')}
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
              placeholder="Enter your email"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                errors.email ? 'border-red-500' : 'border-border'
              }`}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  errors.password ? 'border-red-500' : 'border-border'
                }`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  errors.confirmPassword ? 'border-red-500' : 'border-border'
                }`}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
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

          {/* General Error */}
          {errors.root && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.root.message}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={registrationMutation.isPending}
            className="w-full btn-primary py-2 px-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {registrationMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={() => navigate({ to: '/auth/login' })}
              className="text-primary hover:underline font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            By creating an account, you'll be able to:
          </p>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1">
            <li>• Share your own science competitions</li>
            <li>• Manage your competition posts</li>
            <li>• Connect with the science community</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 