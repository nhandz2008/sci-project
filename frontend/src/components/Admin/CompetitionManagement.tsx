import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  MapPin, 
  Users,
  Star,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { competitionAPI } from '@/client/api'
import { Competition, CompetitionCreate, CompetitionUpdate, CompetitionScale, UserRole, CompetitionManagement as CompetitionManagementType } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { cn, extractErrorMessage } from '@/utils'
import { format } from 'date-fns'

// Validation schema for competition form
const competitionSchema = yup.object({
  title: yup
    .string()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  location: yup
    .string()
    .required('Location is required')
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must be less than 100 characters'),
  scale: yup
    .string()
    .required('Scale is required')
    .oneOf(Object.values(CompetitionScale), 'Invalid scale'),
  start_date: yup
    .string()
    .required('Start date is required'),
  end_date: yup
    .string()
    .required('End date is required')
    .test('end-after-start', 'End date must be after start date', function(value) {
      const { start_date } = this.parent
      return !start_date || !value || new Date(value) > new Date(start_date)
    }),
  registration_deadline: yup
    .string()
    .required('Registration deadline is required')
    .test('deadline-before-start', 'Registration deadline must be before start date', function(value) {
      const { start_date } = this.parent
      return !start_date || !value || new Date(value) < new Date(start_date)
    }),
  external_url: yup
    .string()
    .url('Must be a valid URL')
    .required('External URL is required'),
  prize_structure: yup.string().optional(),
  eligibility: yup.string().optional(),
  age_min: yup.number().min(5, 'Minimum age must be at least 5').max(25, 'Minimum age must be at most 25').optional(),
  age_max: yup.number().min(5, 'Maximum age must be at least 5').max(25, 'Maximum age must be at most 25').optional(),
  grade_min: yup.number().min(1, 'Minimum grade must be at least 1').max(12, 'Minimum grade must be at most 12').optional(),
  grade_max: yup.number().min(1, 'Maximum grade must be at least 1').max(12, 'Maximum grade must be at most 12').optional(),
  subject_areas: yup.string().optional(),
  is_featured: yup.boolean().optional(),
  is_active: yup.boolean().optional(),
})

type CompetitionFormData = yup.InferType<typeof competitionSchema>

interface CompetitionModalProps {
  isOpen: boolean
  onClose: () => void
  competition?: CompetitionManagementType | null
  onSuccess: () => void
}

const CompetitionModal: React.FC<CompetitionModalProps> = ({ isOpen, onClose, competition, onSuccess }) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Transform competition data for form
  const getFormDefaultValues = () => {
    if (!competition) {
      return {
        title: '',
        description: '',
        location: '',
        scale: CompetitionScale.LOCAL,
        start_date: undefined,
        end_date: undefined,
        registration_deadline: undefined,
        external_url: '',
        prize_structure: '',
        eligibility: '',
        age_min: undefined,
        age_max: undefined,
        grade_min: undefined,
        grade_max: undefined,
        subject_areas: '',
        is_featured: false,
        is_active: true,
      }
    }

    // Format dates for datetime-local inputs (YYYY-MM-DDTHH:MM)
    const formatDateForInput = (dateStr: string) => {
      const date = new Date(dateStr)
      return date.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM
    }

    return {
      title: competition.title,
      description: competition.description,
      location: competition.location,
      scale: competition.scale,
      start_date: formatDateForInput(competition.start_date),
      end_date: formatDateForInput(competition.end_date),
      registration_deadline: formatDateForInput(competition.registration_deadline),
      external_url: competition.external_url || '',
      prize_structure: competition.prize_structure || '',
      eligibility: competition.eligibility_criteria || '', // Map eligibility_criteria to eligibility
      age_min: competition.target_age_min || undefined,
      age_max: competition.target_age_max || undefined,
      grade_min: competition.required_grade_min || undefined,
      grade_max: competition.required_grade_max || undefined,
      subject_areas: competition.subject_areas || '',
      is_featured: competition.is_featured || false,
      is_active: competition.is_active ?? true,
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    watch,
  } = useForm<CompetitionFormData>({
    resolver: yupResolver(competitionSchema),
    defaultValues: getFormDefaultValues(),
  })

  // Reset form when competition data changes
  useEffect(() => {
    reset(getFormDefaultValues())
  }, [competition, reset])

  const createMutation = useMutation({
    mutationFn: competitionAPI.createCompetition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions-management'] })
      onSuccess()
      reset()
    },
    onError: (error: any) => {
      const errorMessage = extractErrorMessage(error)
      setError('root', { message: errorMessage })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CompetitionUpdate }) => 
      user?.role === UserRole.ADMIN 
        ? competitionAPI.adminUpdateCompetition(id, data)
        : competitionAPI.updateCompetition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions-management'] })
      onSuccess()
      reset()
    },
    onError: (error: any) => {
      const errorMessage = extractErrorMessage(error)
      setError('root', { message: errorMessage })
    },
  })

  const onSubmit = (data: CompetitionFormData) => {
    // Format dates to YYYY-MM-DD format (date-only)
    const formatDate = (dateValue: Date | string | undefined) => {
      if (!dateValue) return undefined
      const date = new Date(dateValue)
      return date.toISOString().split('T')[0] // Extract date part only
    }

    const competitionData: CompetitionCreate | CompetitionUpdate = {
      title: data.title,
      description: data.description,
      location: data.location,
      scale: data.scale as CompetitionScale,
      start_date: formatDate(data.start_date),
      end_date: formatDate(data.end_date),
      registration_deadline: formatDate(data.registration_deadline),
      external_url: data.external_url,
      prize_structure: data.prize_structure || undefined,
      eligibility_criteria: data.eligibility || undefined,
      target_age_min: data.age_min || undefined,
      target_age_max: data.age_max || undefined,
      required_grade_min: data.grade_min || undefined,
      required_grade_max: data.grade_max || undefined,
      subject_areas: Array.isArray(data.subject_areas) 
        ? data.subject_areas.filter(s => s && s.trim()).join(', ')
        : data.subject_areas || undefined,
      is_featured: user?.role === UserRole.ADMIN ? data.is_featured : false,
      is_active: data.is_active,
    }

    if (competition) {
      updateMutation.mutate({ id: competition.id, data: competitionData })
    } else {
      createMutation.mutate(competitionData as CompetitionCreate)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-card rounded-lg border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {competition ? 'Edit Competition' : 'Create New Competition'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Competition Title
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                errors.title ? 'border-red-500' : 'border-border'
              )}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                errors.description ? 'border-red-500' : 'border-border'
              )}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Location and Scale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-2">
                Location
              </label>
              <input
                id="location"
                type="text"
                {...register('location')}
                className={cn(
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  errors.location ? 'border-red-500' : 'border-border'
                )}
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="scale" className="block text-sm font-medium mb-2">
                Scale
              </label>
              <select
                id="scale"
                {...register('scale')}
                className={cn(
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  errors.scale ? 'border-red-500' : 'border-border'
                )}
              >
                {Object.values(CompetitionScale).map((scale) => (
                  <option key={scale} value={scale}>
                    {scale.charAt(0).toUpperCase() + scale.slice(1)}
                  </option>
                ))}
              </select>
              {errors.scale && (
                <p className="text-red-500 text-sm mt-1">{errors.scale.message}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="registration_deadline" className="block text-sm font-medium mb-2">
                Registration Deadline
              </label>
              <input
                id="registration_deadline"
                type="datetime-local"
                {...register('registration_deadline')}
                className={cn(
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  errors.registration_deadline ? 'border-red-500' : 'border-border'
                )}
              />
              {errors.registration_deadline && (
                <p className="text-red-500 text-sm mt-1">{errors.registration_deadline.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="start_date" className="block text-sm font-medium mb-2">
                Start Date
              </label>
              <input
                id="start_date"
                type="datetime-local"
                {...register('start_date')}
                className={cn(
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  errors.start_date ? 'border-red-500' : 'border-border'
                )}
              />
              {errors.start_date && (
                <p className="text-red-500 text-sm mt-1">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium mb-2">
                End Date
              </label>
              <input
                id="end_date"
                type="datetime-local"
                {...register('end_date')}
                className={cn(
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  errors.end_date ? 'border-red-500' : 'border-border'
                )}
              />
              {errors.end_date && (
                <p className="text-red-500 text-sm mt-1">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* External URL */}
          <div>
            <label htmlFor="external_url" className="block text-sm font-medium mb-2">
              Registration URL
            </label>
            <input
              id="external_url"
              type="url"
              {...register('external_url')}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                errors.external_url ? 'border-red-500' : 'border-border'
              )}
            />
            {errors.external_url && (
              <p className="text-red-500 text-sm mt-1">{errors.external_url.message}</p>
            )}
          </div>

          {/* Age and Grade Ranges */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Age Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  {...register('age_min')}
                  className="w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  min={5}
                  max={25}
                />
                <span className="mx-1">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  {...register('age_max')}
                  className="w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  min={5}
                  max={25}
                />
              </div>
            </div>

            <div className="flex-1 mt-4 md:mt-0">
              <label className="block text-sm font-medium mb-2">Grade Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  {...register('grade_min')}
                  className="w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  min={1}
                  max={12}
                />
                <span className="mx-1">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  {...register('grade_max')}
                  className="w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  min={1}
                  max={12}
                />
              </div>
            </div>
          </div>

          {/* Subject Areas */}
          <div>
            <label htmlFor="subject_areas" className="block text-sm font-medium mb-2">
              Subject Areas
            </label>
            <input
              id="subject_areas"
              type="text"
              {...register('subject_areas')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="e.g., Biology, Chemistry, Physics (comma-separated)"
            />
            {errors.subject_areas && (
              <p className="text-red-500 text-sm mt-1">{errors.subject_areas.message}</p>
            )}
          </div>

          {/* Prize Structure */}
          <div>
            <label htmlFor="prize_structure" className="block text-sm font-medium mb-2">
              Prize Structure
            </label>
            <textarea
              id="prize_structure"
              rows={3}
              {...register('prize_structure')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Describe the prizes and awards..."
            />
            {errors.prize_structure && (
              <p className="text-red-500 text-sm mt-1">{errors.prize_structure.message}</p>
            )}
          </div>

          {/* Eligibility Criteria */}
          <div>
            <label htmlFor="eligibility" className="block text-sm font-medium mb-2">
              Eligibility Criteria
            </label>
            <textarea
              id="eligibility"
              rows={3}
              {...register('eligibility')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Who can participate in this competition?"
            />
            {errors.eligibility && (
              <p className="text-red-500 text-sm mt-1">{errors.eligibility.message}</p>
            )}
          </div>

          {/* Admin-only fields */}
          {user?.role === UserRole.ADMIN && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Admin Options</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('is_featured')}
                    className="rounded border-border"
                  />
                  <span className="text-sm">Featured Competition</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('is_active')}
                    className="rounded border-border"
                  />
                  <span className="text-sm">Active Competition</span>
                </label>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.root && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-700 text-sm">{errors.root.message}</span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                'Saving...'
              ) : (
                competition ? 'Update Competition' : 'Create Competition'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const CompetitionManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionManagementType | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<CompetitionManagementType | null>(null)

  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch competitions using the new management endpoint
  const { data: competitionsData, isLoading, error } = useQuery({
    queryKey: ['competitions-management'],
    queryFn: () => competitionAPI.getCompetitionsForManagement({ 
      skip: 0, 
      limit: 100, 
      include_inactive: true 
    }),
    enabled: !!user,
  })

  const deleteMutation = useMutation({
    mutationFn: competitionAPI.deleteCompetition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions-management'] })
      setDeleteConfirm(null)
    },
    onError: (error: any) => {
      console.error('Failed to delete competition:', error)
    },
  })

  const competitions = competitionsData?.competitions || []
  const filteredCompetitions = competitions.filter(competition =>
    competition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    competition.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    competition.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateCompetition = () => {
    setSelectedCompetition(null)
    setIsModalOpen(true)
  }

  const handleEditCompetition = (competition: CompetitionManagementType) => {
    setSelectedCompetition(competition)
    setIsModalOpen(true)
  }

  const handleDeleteCompetition = (competition: CompetitionManagementType) => {
    setDeleteConfirm(competition)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedCompetition(null)
  }

  const handleModalSuccess = () => {
    setIsModalOpen(false)
    setSelectedCompetition(null)
  }

  const getScaleBadgeColor = (scale: CompetitionScale) => {
    switch (scale) {
      case CompetitionScale.LOCAL:
        return 'bg-green-100 text-green-800'
      case CompetitionScale.REGIONAL:
        return 'bg-blue-100 text-blue-800'
      case CompetitionScale.NATIONAL:
        return 'bg-purple-100 text-purple-800'
      case CompetitionScale.INTERNATIONAL:
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading competitions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500">Failed to load competitions</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Competition Management</h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === UserRole.ADMIN 
              ? 'Manage all competitions in the system'
              : 'Manage your competitions'
            }
          </p>
        </div>
        <button
          onClick={handleCreateCompetition}
          className="btn-primary flex items-center gap-2 px-4 py-3"
        >
          <Plus className="w-4 h-4" />
          New Competition
        </button>
      </div>

      {/* Search and Stats */}
      <div className="bg-card rounded-lg border p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search competitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total: {competitions.length}</span>
            <span>Active: {competitions.filter(c => c.is_active).length}</span>
            {user?.role === UserRole.ADMIN && (
              <span>Featured: {competitions.filter(c => c.is_featured).length}</span>
            )}
          </div>
        </div>
      </div>

      {/* Competitions Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Competition</th>
                <th className="px-4 py-3 text-left font-medium">Location</th>
                <th className="px-4 py-3 text-left font-medium">Scale</th>
                <th className="px-4 py-3 text-left font-medium">Dates</th>
                {user?.role === UserRole.ADMIN && (
                  <th className="px-4 py-3 text-left font-medium">Creator</th>
                )}
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompetitions.map((competition) => (
                <tr key={competition.id} className="border-t hover:bg-muted/50">
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      {competition.is_featured && (
                        <Star className="w-4 h-4 text-yellow-500 mt-1" />
                      )}
                      <div>
                        <div className="font-medium">{competition.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {competition.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{competition.location}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      getScaleBadgeColor(competition.scale)
                    )}>
                      {competition.scale}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span>Reg: {format(new Date(competition.registration_deadline), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {format(new Date(competition.start_date), 'MMM d')} - {format(new Date(competition.end_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </td>
                  {user?.role === UserRole.ADMIN && (
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <div className="font-medium">{competition.creator.username}</div>
                        <div className="text-muted-foreground">{competition.creator.email}</div>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      getStatusBadgeColor(competition.is_active)
                    )}>
                      {competition.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditCompetition(competition)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCompetition(competition)}
                        className="p-1 text-muted-foreground hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCompetitions.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No competitions match your search.' : 'No competitions found.'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateCompetition}
                className="btn-primary mt-4"
              >
                Create your first competition
              </button>
            )}
          </div>
        )}
      </div>

      {/* Competition Modal */}
      <CompetitionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        competition={selectedCompetition}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-card rounded-lg border p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold">Delete Competition</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 