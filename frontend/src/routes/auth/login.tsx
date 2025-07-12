import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { LoginForm } from '@/components/Auth/LoginForm'
import { useAuth } from '@/hooks/useAuth'
import Footer from '@/components/Common/Footer'

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, navigate])

  const handleLoginSuccess = () => {
    // Navigate to dashboard after successful login
    navigate({ to: '/dashboard' })
  }

  if (isAuthenticated) {
    return null // Prevent flash while redirecting
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Science Competitions Insight
            </h1>
            <p className="text-muted-foreground">
              Discover and manage science competitions worldwide
            </p>
          </div>
          
          <LoginForm onSuccess={handleLoginSuccess} />
          
          <div className="text-center mt-6">
            <button
              onClick={() => navigate({ to: '/' })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
} 