import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { UserProfile } from '@/components/Auth/UserProfile'
import { useAuth } from '@/hooks/useAuth'
import { LayoutDashboard, Users, Trophy, BarChart3 } from 'lucide-react'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
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
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Prevent flash while redirecting
  }

  const dashboardItems = [
    {
      title: 'Overview',
      description: 'Dashboard overview and statistics',
      icon: LayoutDashboard,
      href: '/dashboard',
      color: 'text-blue-500',
    },
    {
      title: 'Competitions',
      description: 'Manage science competitions',
      icon: Trophy,
      href: '/dashboard/competitions',
      color: 'text-green-500',
    },
    {
      title: 'Analytics',
      description: 'View performance metrics',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'text-purple-500',
    },
  ]

  // Add admin-only items
  if (user.role === 'admin') {
    dashboardItems.push({
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: Users,
      href: '/dashboard/users',
      color: 'text-orange-500',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto container-padding">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate({ to: '/' })}
                className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
              >
                SCI Dashboard
              </button>
            </div>
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto container-padding py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.username}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your science competitions platform.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dashboardItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.href}
                onClick={() => navigate({ to: item.href })}
                className="p-6 bg-card rounded-lg border hover:border-primary/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`h-6 w-6 ${item.color}`} />
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* User Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserProfile showFullProfile={true} />
          
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">{user.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Account Status</span>
                <span className={`font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Access Level</span>
                <span className="font-medium">
                  {user.role === 'admin' ? 'Full Access' : 'Creator Access'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 