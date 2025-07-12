import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { RegisterForm } from '@/components/Auth/RegisterForm'
import { useAuth } from '@/hooks/useAuth'
import { User } from '@/types'
import Footer from '@/components/Common/Footer'

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, navigate])

  const handleRegistrationSuccess = (user: User) => {
    // Navigate to login page after successful registration
    navigate({ 
      to: '/auth/login',
      search: { 
        message: 'Registration successful! Please log in with your new account.',
        email: user.email 
      }
    })
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
              Join our community of science enthusiasts
            </p>
          </div>
          
          <RegisterForm onSuccess={handleRegistrationSuccess} />
          
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