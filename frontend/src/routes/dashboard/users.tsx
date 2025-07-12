import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { UserManagement } from '@/components/Admin/UserManagement'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types'
import Header from '@/components/Common/Header'

export const Route = createFileRoute('/dashboard/users')({
  component: UserManagementPage,
})

function UserManagementPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user, isLoading } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/auth/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== UserRole.ADMIN) {
      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, user, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading user management...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || user.role !== UserRole.ADMIN) {
    return null // Prevent flash while redirecting
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto container-padding">
        <UserManagement />
      </main>
    </div>
  )
} 