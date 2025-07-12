import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { competitionAPI } from '@/client/api'
import { CompetitionDetail, CompetitionForm } from '@/components/Competition'
import { useAuth } from '@/hooks/useAuth'
import { CompetitionUpdate } from '@/types'

const CompetitionDetailPage = () => {
  const { competitionId } = Route.useParams()
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const {
    data: competition,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: () => competitionAPI.getCompetition(parseInt(competitionId)),
    retry: false,
  })

  const updateMutation = useMutation({
    mutationFn: (data: CompetitionUpdate) => 
      competitionAPI.updateCompetition(parseInt(competitionId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] })
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
      setIsEditing(false)
    },
    onError: (error: any) => {
      console.error('Error updating competition:', error)
      alert('Failed to update competition. Please try again.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => competitionAPI.deleteCompetition(parseInt(competitionId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
      router.navigate({ to: '/competitions' })
    },
    onError: (error: any) => {
      console.error('Error deleting competition:', error)
      alert('Failed to delete competition. Please try again.')
    },
  })

  const imageUploadMutation = useMutation({
    mutationFn: (file: File) => 
      competitionAPI.uploadCompetitionImage(parseInt(competitionId), file),
    onSuccess: (response) => {
      return response.image_url
    },
    onError: (error: any) => {
      console.error('Error uploading image:', error)
      throw error
    },
  })

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleUpdate = async (data: CompetitionUpdate) => {
    await updateMutation.mutateAsync(data)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    await deleteMutation.mutateAsync()
    setShowDeleteConfirm(false)
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    const response = await imageUploadMutation.mutateAsync(file)
    return response.image_url
  }

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
        {isEditing ? (
          <CompetitionForm
            competition={competition}
            onSubmit={handleUpdate}
            onCancel={handleCancelEdit}
            onImageUpload={handleImageUpload}
            loading={updateMutation.isPending || imageUploadMutation.isPending}
          />
        ) : (
          <CompetitionDetail
            competition={competition}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Competition
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{competition.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
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