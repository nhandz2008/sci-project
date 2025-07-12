import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { UserProfile } from '@/components/Auth/UserProfile'
import { LogIn, UserPlus, Search, Bot } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto container-padding">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold text-primary">
              Science Competitions Insight
            </h1>
            
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => navigate({ to: '/dashboard' })}
                    className="btn-outline px-4 py-2"
                  >
                    Dashboard
                  </button>
                  <UserProfile />
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate({ to: '/auth/register' })}
                    className="btn-outline px-4 py-2 flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Sign Up
                  </button>
                  <button
                    onClick={() => navigate({ to: '/auth/login' })}
                    className="btn-primary px-4 py-2 flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto container-padding">
        <div className="section-spacing text-center">
          <h1 className="mb-6">Science Competitions Insight</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover and manage science & technology competitions worldwide. 
            Connect with opportunities that match your interests and expertise.
          </p>
          
          {isAuthenticated ? (
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => navigate({ to: '/competitions' })}
                className="btn-primary px-6 py-3 flex items-center gap-2"
              >
                <Search className="h-5 w-5" />
                Explore Competitions
              </button>
              <button className="btn-outline px-6 py-3 flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Get AI Recommendations
              </button>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => navigate({ to: '/auth/register' })}
                className="btn-primary px-6 py-3 flex items-center gap-2"
              >
                <UserPlus className="h-5 w-5" />
                Join the Community
              </button>
              <button 
                onClick={() => navigate({ to: '/competitions' })}
                className="btn-outline px-6 py-3 flex items-center gap-2"
              >
                <Search className="h-5 w-5" />
                Browse Competitions
              </button>
            </div>
          )}
        </div>
        
        {/* Features Section */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Join SCI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Discover Opportunities",
                description: "Find science competitions that match your interests and skill level",
                scale: "Local",
                color: "text-green-500"
              },
              {
                title: "Share Your Events",
                description: "Post your own competitions and reach a global audience",
                scale: "Regional", 
                color: "text-blue-500"
              },
              {
                title: "Connect & Grow",
                description: "Join a community of passionate scientists and innovators",
                scale: "International",
                color: "text-purple-500"
              }
            ].map((feature, i) => (
              <div key={i} className="bg-card rounded-lg p-6 shadow-sm border hover:border-primary/50 transition-colors">
                <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-md mb-4 flex items-center justify-center">
                  <div className="text-6xl opacity-30">🏆</div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  {feature.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className={`text-sm px-2 py-1 rounded bg-primary/10 ${feature.color} font-medium`}>
                    {feature.scale}
                  </span>
                  <button 
                    onClick={() => navigate({ to: isAuthenticated ? '/dashboard' : '/auth/register' })}
                    className="btn-ghost px-3 py-1 text-sm hover:text-primary transition-colors"
                  >
                    {isAuthenticated ? 'Get Started' : 'Join Now'} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action for Non-Authenticated Users */}
        {!isAuthenticated && (
          <section className="py-16 bg-muted/30 rounded-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                Ready to Join the Community? 🚀
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Create your free account today and start discovering amazing science competitions from around the world.
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => navigate({ to: '/auth/register' })}
                  className="btn-primary px-6 py-3 flex items-center gap-2"
                >
                  <UserPlus className="h-5 w-5" />
                  Create Free Account
                </button>
                <button 
                  onClick={() => navigate({ to: '/auth/login' })}
                  className="btn-outline px-6 py-3 flex items-center gap-2"
                >
                  <LogIn className="h-5 w-5" />
                  Already have an account?
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Welcome Message for Authenticated Users */}
        {isAuthenticated && user && (
          <section className="py-16 bg-muted/30 rounded-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                Welcome back, {user.username}! 👋
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                You're signed in as {user.role}. Ready to explore new competitions or manage your existing ones?
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => navigate({ to: '/competitions' })}
                  className="btn-primary px-6 py-3"
                >
                  Explore Competitions
                </button>
                <button 
                  onClick={() => navigate({ to: '/dashboard' })}
                  className="btn-outline px-6 py-3"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
} 