import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, Mail, Lock, Loader2, UserPlus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils'
import type { LoginCredentials } from '@/types'

// Validation schema
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
})

interface LoginFormProps {
  onSuccess?: () => void
  className?: string
}

export const LoginForm = ({ onSuccess, className }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setLoginError(null)
      await login(data)
      onSuccess?.()
    } catch (error: any) {
      console.error('Login error:', error)
      setLoginError(
        error.response?.data?.detail || 
        error.message || 
        'Login failed. Please check your credentials and try again.'
      )
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-muted-foreground mt-2">
            Sign in to your SCI account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label 
              htmlFor="email" 
              className="text-sm font-medium text-foreground"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                {...register('email')}
                type="email"
                id="email"
                placeholder="admin@sci.com"
                className={cn(
                  'w-full pl-10 pr-4 py-2 border rounded-md bg-background',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                  errors.email && 'border-destructive'
                )}
                disabled={isSubmitting || isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label 
              htmlFor="password" 
              className="text-sm font-medium text-foreground"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                className={cn(
                  'w-full pl-10 pr-10 py-2 border rounded-md bg-background',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                  errors.password && 'border-destructive'
                )}
                disabled={isSubmitting || isLoading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isSubmitting || isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Login Error */}
          {loginError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{loginError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className={cn(
              'w-full py-2 px-4 rounded-md font-medium transition-colors',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            {(isSubmitting || isLoading) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {(isSubmitting || isLoading) ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Registration Link */}
        <div className="mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Don't have an account?
            </p>
            <button
              onClick={() => navigate({ to: '/auth/register' })}
              className="btn-outline px-4 py-2 flex items-center gap-2 mx-auto"
            >
              <UserPlus className="h-4 w-4" />
              Create New Account
            </button>
          </div>
        </div>

        {/* Demo Accounts */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center mb-3">
            Demo Accounts for Testing:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-muted rounded text-center">
              <p className="font-medium">Admin</p>
              <p>admin@sci.com</p>
              <p>admin123</p>
            </div>
            <div className="p-2 bg-muted rounded text-center">
              <p className="font-medium">Creator</p>
              <p>creator@sci.com</p>
              <p>creator123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 