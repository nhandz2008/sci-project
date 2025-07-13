import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { UserPlus, Search, Bot, Users, ArrowRight, Building2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { competitionAPI } from '@/client/api'
import type { CompetitionCard as CompetitionCardType } from '@/types'
import CompetitionCard from '@/components/Competition/CompetitionCard'
import Header from '@/components/Common/Header'
import Footer from '@/components/Common/Footer'
import { RecommendationWizard } from '@/components/Recommendation'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [featuredCompetitions, setFeaturedCompetitions] = useState<CompetitionCardType[]>([])
  const [loading, setLoading] = useState(true)
  const [isRecommendationWizardOpen, setIsRecommendationWizardOpen] = useState(false)

  useEffect(() => {
    const fetchFeaturedCompetitions = async () => {
      try {
        const competitions = await competitionAPI.getFeaturedCompetitions(6)
        setFeaturedCompetitions(competitions)
      } catch (error) {
        console.error('Failed to fetch featured competitions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedCompetitions()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

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
              <button 
                onClick={() => setIsRecommendationWizardOpen(true)}
                className="btn-outline px-6 py-3 flex items-center gap-2"
              >
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
        
        {/* What SCI Provides Section */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">What SCI Provides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* For Participants */}
            <div className="bg-card rounded-lg p-8 shadow-sm border hover:border-primary/50 transition-colors">
              <div className="h-32 bg-gradient-to-br from-green-50 to-emerald-100 rounded-md mb-6 flex items-center justify-center">
                <Users className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-green-700">For Participants</h3>
              <h4 className="text-lg font-medium mb-3 text-green-600">Discover Opportunities, Connect & Grow</h4>
              <p className="text-muted-foreground mb-6">
                Find science competitions that match your interests and skill level. 
                Join a community of passionate scientists and innovators.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                  Global Access
                </span>
                <button 
                  onClick={() => navigate({ to: '/competitions' })}
                  className="btn-ghost px-3 py-1 text-sm hover:text-green-600 transition-colors flex items-center gap-1"
                >
                  Explore Competitions <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* For Organizers */}
            <div className="bg-card rounded-lg p-8 shadow-sm border hover:border-primary/50 transition-colors">
              <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-md mb-6 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-blue-700">For Organizers</h3>
              <h4 className="text-lg font-medium mb-3 text-blue-600">Share Your Events</h4>
              <p className="text-muted-foreground mb-6">
                Post your own competitions and reach a global audience. 
                Connect with talented participants from around the world.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                  Global Reach
                </span>
                <button 
                  onClick={() => navigate({ to: isAuthenticated ? '/dashboard/competitions' : '/auth/register' })}
                  className="btn-ghost px-3 py-1 text-sm hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  {isAuthenticated ? 'Create Competition' : 'Get Started'} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Competitions Section */}
        <section className="py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Competitions</h2>
            <button 
              onClick={() => navigate({ to: '/competitions' })}
              className="btn-outline px-4 py-2 flex items-center gap-2 hover:bg-primary hover:text-white transition-colors"
            >
              View All Competitions
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : featuredCompetitions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCompetitions.map((competition) => (
                <CompetitionCard
                  key={competition.id}
                  competition={competition}
                  variant="featured"
                  className="h-full"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold mb-2">No Featured Competitions</h3>
              <p className="text-muted-foreground mb-4">
                Check back soon for exciting featured competitions!
              </p>
              <button 
                onClick={() => navigate({ to: '/competitions' })}
                className="btn-primary px-6 py-2"
              >
                Browse All Competitions
              </button>
            </div>
          )}
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
      
      {/* Footer */}
      <Footer />

      {/* Recommendation Wizard Modal */}
      <RecommendationWizard 
        isOpen={isRecommendationWizardOpen}
        onClose={() => setIsRecommendationWizardOpen(false)}
      />
    </div>
  )
} 