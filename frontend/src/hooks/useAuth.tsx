import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authAPI, tokenManager } from '@/client/api'
import type { User, LoginCredentials, AuthResponse } from '@/types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  refetchUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const queryClient = useQueryClient()

  // Check initial auth state
  useEffect(() => {
    const token = tokenManager.getToken()
    setIsAuthenticated(token !== null && !tokenManager.isTokenExpired(token))
  }, [])

  // Listen for logout events (from API interceptor)
  useEffect(() => {
    const handleLogout = () => {
      setIsAuthenticated(false)
      queryClient.clear()
    }

    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [queryClient])

  // Query to get current user (only when authenticated)
  const {
    data: user,
    isLoading,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authAPI.getCurrentUser,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data: AuthResponse) => {
      setIsAuthenticated(true)
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
    onError: (error) => {
      console.error('Login failed:', error)
      setIsAuthenticated(false)
      tokenManager.removeToken()
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSettled: () => {
      // Always clear state regardless of API success/failure
      setIsAuthenticated(false)
      queryClient.clear()
    },
  })

  const login = async (credentials: LoginCredentials): Promise<void> => {
    await loginMutation.mutateAsync(credentials)
  }

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync()
  }

  const value: AuthContextType = {
    user: user || null,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
    login,
    logout,
    refetchUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Authentication Required</h1>
            <p className="mt-2 text-muted-foreground">
              Please log in to access this page.
            </p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}

// Hook for role-based access control
export const useRequireRole = (requiredRole: 'admin' | 'creator') => {
  const { user } = useAuth()

  const hasRole = (() => {
    if (!user) return false
    if (requiredRole === 'admin') return user.role === 'admin'
    if (requiredRole === 'creator') return ['admin', 'creator'].includes(user.role)
    return false
  })()

  return { hasRole, user }
} 