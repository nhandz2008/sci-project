import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { CompetitionManagement } from '@/components/Admin/CompetitionManagement'
import { useAuth } from '@/hooks/useAuth'

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
      <header className="border-b bg-card">
        <div className="container mx-auto container-padding">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate({ to: '/dashboard' })}
                className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
              >
                SCI Dashboard
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-lg font-medium">Competition Management</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto container-padding">
        <CompetitionManagement />
      </main>
    </div>
  )
} 