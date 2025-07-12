import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { CompetitionManagement } from '@/components/Admin/CompetitionManagement'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/Common/Header'

export const Route = createFileRoute('/dashboard/competitions')({
  component: CompetitionManagementPage,
})

function CompetitionManagementPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user, isLoading } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/auth/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading competition management...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Prevent flash while redirecting
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto container-padding">
        <CompetitionManagement />
      </main>
    </div>
  )
} 