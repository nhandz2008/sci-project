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
                <button
                  onClick={() => navigate({ to: '/auth/login' })}
                  className="btn-primary px-4 py-2 flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </button>
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
                onClick={() => navigate({ to: '/dashboard' })}
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
                onClick={() => navigate({ to: '/auth/login' })}
                className="btn-primary px-6 py-3 flex items-center gap-2"
              >
                <LogIn className="h-5 w-5" />
                Sign In to Get Started
              </button>
              <button className="btn-outline px-6 py-3 flex items-center gap-2">
                <Search className="h-5 w-5" />
                Browse Competitions
              </button>
            </div>
          )}
        </div>
        
        {/* Features Section */}
        <section className="py-16">
          <h2 className="text-center mb-12">Featured Competitions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Global Science Fair 2024",
                description: "International competition for young scientists showcasing innovative research projects.",
                scale: "International",
                color: "text-blue-600"
              },
              {
                title: "AI Innovation Challenge",
                description: "Develop AI solutions for real-world problems in healthcare, environment, and education.",
                scale: "National",
                color: "text-green-600"
              },
              {
                title: "Climate Solutions Contest",
                description: "Design sustainable solutions to combat climate change and environmental issues.",
                scale: "Regional",
                color: "text-purple-600"
              }
            ].map((competition, i) => (
              <div key={i} className="bg-card rounded-lg p-6 shadow-sm border hover:border-primary/50 transition-colors">
                <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-md mb-4 flex items-center justify-center">
                  <div className="text-6xl opacity-30">🏆</div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{competition.title}</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  {competition.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className={`text-sm px-2 py-1 rounded bg-primary/10 ${competition.color} font-medium`}>
                    {competition.scale}
                  </span>
                  <button className="btn-ghost px-3 py-1 text-sm hover:text-primary transition-colors">
                    Learn More →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

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
                  onClick={() => navigate({ to: '/dashboard' })}
                  className="btn-primary px-6 py-3"
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