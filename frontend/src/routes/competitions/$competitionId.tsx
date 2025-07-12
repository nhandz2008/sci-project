import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { competitionAPI } from '@/client/api'
import { CompetitionDetail } from '@/components/Competition'
import { useAuth } from '@/hooks/useAuth'

const CompetitionDetailPage = () => {
  const { competitionId } = Route.useParams()
  const router = useRouter()
  const { user } = useAuth()

  const {
    data: competition,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: () => competitionAPI.getCompetition(parseInt(competitionId)),
    retry: false,
  })



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-80 bg-gray-200 rounded-lg mb-6"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !competition) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Competition Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The competition you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.navigate({ to: '/competitions' })}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Browse Competitions
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CompetitionDetail
          competition={competition}
        />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/competitions/$competitionId')({
  component: CompetitionDetailPage,
  meta: ({ params }) => [
    {
      title: `Competition Details | SCI Platform`,
    },
    {
      name: 'description',
      content: 'View detailed information about this science competition including dates, eligibility, prizes, and registration details.',
    },
  ],
}) 