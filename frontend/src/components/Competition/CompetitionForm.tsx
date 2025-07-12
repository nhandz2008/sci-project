import React, { useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { format } from 'date-fns'
import { 
  Save, 
  X, 
  Upload, 
  Image as ImageIcon,
  Calendar,
  MapPin,
  Users,
  BookOpen,
  Trophy,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { CompetitionCreate, CompetitionUpdate, CompetitionScale, Competition } from '@/types'
import { cn } from '@/utils'

// Validation schema
const competitionSchema = yup.object({
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  location: yup.string().required('Location is required'),
  scale: yup.string().required('Scale is required').oneOf(Object.values(CompetitionScale)),
  start_date: yup.date().required('Start date is required').min(new Date(), 'Start date must be in the future'),
  end_date: yup.date().required('End date is required').min(yup.ref('start_date'), 'End date must be after start date'),
  registration_deadline: yup.date().required('Registration deadline is required').max(yup.ref('start_date'), 'Registration deadline must be before start date'),
  prize_structure: yup.string().optional(),
  eligibility_criteria: yup.string().optional(),
  external_url: yup.string().url('Must be a valid URL').optional(),
  target_age_min: yup.number().optional().min(5, 'Minimum age is 5').max(25, 'Maximum age is 25'),
  target_age_max: yup.number().optional().min(5, 'Minimum age is 5').max(25, 'Maximum age is 25').when('target_age_min', (target_age_min, schema) => 
    target_age_min ? schema.min(target_age_min, 'Maximum age must be greater than minimum age') : schema
  ),
  required_grade_min: yup.number().optional().min(1, 'Minimum grade is 1').max(12, 'Maximum grade is 12'),
  required_grade_max: yup.number().optional().min(1, 'Minimum grade is 1').max(12, 'Maximum grade is 12').when('required_grade_min', (required_grade_min, schema) => 
    required_grade_min ? schema.min(required_grade_min, 'Maximum grade must be greater than minimum grade') : schema
  ),
  subject_areas: yup.string().optional(),
  is_featured: yup.boolean().optional(),
  is_active: yup.boolean().optional(),
})

interface CompetitionFormProps {
  competition?: Competition
  onSubmit: (data: CompetitionCreate | CompetitionUpdate) => Promise<void>
  onCancel: () => void
  onImageUpload?: (file: File) => Promise<string>
  loading?: boolean
  className?: string
}

const CompetitionForm: React.FC<CompetitionFormProps> = ({
  competition,
  onSubmit,
  onCancel,
  onImageUpload,
  loading = false,
  className,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(competition?.image_url || null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = Boolean(competition)

  const defaultValues = competition ? {
    title: competition.title,
    description: competition.description,
    location: competition.location,
    scale: competition.scale,
    start_date: format(new Date(competition.start_date), 'yyyy-MM-dd'),
    end_date: format(new Date(competition.end_date), 'yyyy-MM-dd'),
    registration_deadline: format(new Date(competition.registration_deadline), 'yyyy-MM-dd'),
    prize_structure: competition.prize_structure || '',
    eligibility_criteria: competition.eligibility_criteria || '',
    external_url: competition.external_url || '',
    target_age_min: competition.target_age_min || undefined,
    target_age_max: competition.target_age_max || undefined,
    required_grade_min: competition.required_grade_min || undefined,
    required_grade_max: competition.required_grade_max || undefined,
    subject_areas: competition.subject_areas || '',
    is_featured: competition.is_featured || false,
    is_active: competition.is_active || true,
  } : {
    title: '',
    description: '',
    location: '',
    scale: CompetitionScale.LOCAL,
    start_date: '',
    end_date: '',
    registration_deadline: '',
    prize_structure: '',
    eligibility_criteria: '',
    external_url: '',
    target_age_min: undefined,
    target_age_max: undefined,
    required_grade_min: undefined,
    required_grade_max: undefined,
    subject_areas: '',
    is_featured: false,
    is_active: true,
  }

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    resolver: yupResolver(competitionSchema),
    defaultValues,
  })

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFormSubmit = async (data: any) => {
    try {
      let finalData = { ...data }

      // Handle image upload if there's a new image
      if (imageFile && onImageUpload) {
        setUploadingImage(true)
        try {
          const imageUrl = await onImageUpload(imageFile)
          finalData.image_url = imageUrl
        } catch (error) {
          console.error('Error uploading image:', error)
          throw new Error('Failed to upload image')
        } finally {
          setUploadingImage(false)
        }
      }

      // Convert empty strings to undefined for optional fields
      Object.keys(finalData).forEach(key => {
        if (finalData[key] === '') {
          finalData[key] = undefined
        }
      })

      await onSubmit(finalData)
    } catch (error) {
      console.error('Error submitting form:', error)
      throw error
    }
  }

  const watchedValues = watch()

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Competition' : 'Create Competition'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
          disabled={loading || isSubmitting}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Competition Image
          </label>
          <div className="flex items-start space-x-4">
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No image</p>
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                ref={fileInputRef}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload Image
              </button>
              <p className="text-sm text-gray-500 mt-1">
                Recommended: 1200x600px or similar aspect ratio
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className={cn(
                    'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500',
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  )}
                  placeholder="Enter competition title"
                />
              )}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className={cn(
                    'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500',
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  )}
                  placeholder="Enter location"
                />
              )}
            />
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={4}
                className={cn(
                  'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500',
                  errors.description ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="Describe the competition..."
              />
            )}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Scale and Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scale *
            </label>
            <Controller
              name="scale"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={cn(
                    'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500',
                    errors.scale ? 'border-red-500' : 'border-gray-300'
                  )}
                >
                  <option value={CompetitionScale.LOCAL}>Local</option>
                  <option value={CompetitionScale.REGIONAL}>Regional</option>
                  <option value={CompetitionScale.NATIONAL}>National</option>
                  <option value={CompetitionScale.INTERNATIONAL}>International</option>
                </select>
              )}
            />
            {errors.scale && (
              <p className="text-red-500 text-sm mt-1">{errors.scale.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  className={cn(
                    'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500',
                    errors.start_date ? 'border-red-500' : 'border-gray-300'
                  )}
                />
              )}
            />
            {errors.start_date && (
              <p className="text-red-500 text-sm mt-1">{errors.start_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <Controller
              name="end_date"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  className={cn(
                    'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500',
                    errors.end_date ? 'border-red-500' : 'border-gray-300'
                  )}
                />
              )}
            />
            {errors.end_date && (
              <p className="text-red-500 text-sm mt-1">{errors.end_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Deadline *
            </label>
            <Controller
              name="registration_deadline"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  className={cn(
                    'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500',
                    errors.registration_deadline ? 'border-red-500' : 'border-gray-300'
                  )}
                />
              )}
            />
            {errors.registration_deadline && (
              <p className="text-red-500 text-sm mt-1">{errors.registration_deadline.message}</p>
            )}
          </div>
        </div>

        {/* External URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registration URL
          </label>
          <Controller
            name="external_url"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="url"
                className={cn(
                  'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500',
                  errors.external_url ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="https://example.com/register"
              />
            )}
          />
          {errors.external_url && (
            <p className="text-red-500 text-sm mt-1">{errors.external_url.message}</p>
          )}
        </div>

        {/* Age and Grade Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Controller
                  name="target_age_min"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="5"
                      max="25"
                      className={cn(
                        'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500',
                        errors.target_age_min ? 'border-red-500' : 'border-gray-300'
                      )}
                      placeholder="Min age"
                    />
                  )}
                />
                {errors.target_age_min && (
                  <p className="text-red-500 text-xs mt-1">{errors.target_age_min.message}</p>
                )}
              </div>
              <div>
                <Controller
                  name="target_age_max"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="5"
                      max="25"
                      className={cn(
                        'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500',
                        errors.target_age_max ? 'border-red-500' : 'border-gray-300'
                      )}
                      placeholder="Max age"
                    />
                  )}
                />
                {errors.target_age_max && (
                  <p className="text-red-500 text-xs mt-1">{errors.target_age_max.message}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Controller
                  name="required_grade_min"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="1"
                      max="12"
                      className={cn(
                        'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500',
                        errors.required_grade_min ? 'border-red-500' : 'border-gray-300'
                      )}
                      placeholder="Min grade"
                    />
                  )}
                />
                {errors.required_grade_min && (
                  <p className="text-red-500 text-xs mt-1">{errors.required_grade_min.message}</p>
                )}
              </div>
              <div>
                <Controller
                  name="required_grade_max"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="1"
                      max="12"
                      className={cn(
                        'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500',
                        errors.required_grade_max ? 'border-red-500' : 'border-gray-300'
                      )}
                      placeholder="Max grade"
                    />
                  )}
                />
                {errors.required_grade_max && (
                  <p className="text-red-500 text-xs mt-1">{errors.required_grade_max.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subject Areas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject Areas
          </label>
          <Controller
            name="subject_areas"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Biology, Chemistry, Physics (comma-separated)"
              />
            )}
          />
        </div>

        {/* Prize Structure */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prize Structure
          </label>
          <Controller
            name="prize_structure"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the prizes and awards..."
              />
            )}
          />
        </div>

        {/* Eligibility Criteria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Eligibility Criteria
          </label>
          <Controller
            name="eligibility_criteria"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Who can participate in this competition?"
              />
            )}
          />
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <div className="flex items-center">
            <Controller
              name="is_featured"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="checkbox"
                  checked={field.value}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              )}
            />
            <label className="ml-2 text-sm text-gray-700">
              Featured competition (appears in highlights)
            </label>
          </div>

          <div className="flex items-center">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="checkbox"
                  checked={field.value}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              )}
            />
            <label className="ml-2 text-sm text-gray-700">
              Active (visible to public)
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            disabled={loading || isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            disabled={loading || isSubmitting || uploadingImage}
          >
            {(loading || isSubmitting || uploadingImage) ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploadingImage ? 'Uploading...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Update Competition' : 'Create Competition'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CompetitionForm 