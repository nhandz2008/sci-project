import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { competitionAPI } from '@/client/api'
import { CompetitionForm } from '@/components/Competition'
import { useAuth } from '@/hooks/useAuth'
import { CompetitionCreate } from '@/types'

const CreateCompetitionPage = () => {
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: CompetitionCreate) => competitionAPI.createCompetition(data),
    onSuccess: (competition) => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
      router.navigate({ to: `/competitions/${competition.id}` })
    },
    onError: (error: any) => {
      console.error('Error creating competition:', error)
      alert('Failed to create competition. Please try again.')
    },
  })

  const handleSubmit = async (data: CompetitionCreate) => {
    await createMutation.mutateAsync(data)
  }

  const handleCancel = () => {
    router.navigate({ to: '/competitions' })
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    // Note: Image upload after creation would require a different approach
    // For now, we'll return a placeholder URL
    // In a real implementation, you might upload to a temporary location
    // or handle image upload after competition creation
    return URL.createObjectURL(file)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <CompetitionForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onImageUpload={handleImageUpload}
            loading={createMutation.isPending}
          />
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/competitions/create')({
  component: CreateCompetitionPage,
  beforeLoad: async ({ context }) => {
    // Check if user is authenticated and has creator role
    const { user } = context.auth || {}
    if (!user) {
      throw redirect({
        to: '/auth/login',
        search: {
          redirect: '/competitions/create',
        },
      })
    }
    
    if (user.role !== 'creator' && user.role !== 'admin') {
      throw redirect({
        to: '/competitions',
      })
    }
  },
  meta: () => [
    {
      title: 'Create Competition | SCI Platform',
    },
    {
      name: 'description',
      content: 'Create a new science competition with detailed information, dates, and registration details.',
    },
  ],
}) 