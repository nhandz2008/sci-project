import React from 'react'
import { Calendar, Search, TrendingUp } from 'lucide-react'
import CompetitionCard from './CompetitionCard'
import type { CompetitionCard as CompetitionCardType, CompetitionPublic } from '@/types'
import { cn } from '@/utils'

interface CompetitionGridProps {
  competitions: (CompetitionCardType | CompetitionPublic)[]
  loading?: boolean
  error?: string
  emptyMessage?: string
  className?: string
  variant?: 'default' | 'featured' | 'compact'
  columns?: 1 | 2 | 3 | 4
}

const CompetitionGrid: React.FC<CompetitionGridProps> = ({
  competitions,
  loading = false,
  error,
  emptyMessage = 'No competitions found',
  className,
  variant = 'default',
  columns = 3,
}) => {
  const getGridColumns = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-1 md:grid-cols-2'
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn('grid gap-6', getGridColumns(), className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (!competitions.length) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No competitions found</h3>
          <p className="text-gray-600 mb-4">{emptyMessage}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Results header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-gray-600">
            {competitions.length} competition{competitions.length !== 1 ? 's' : ''} found
          </span>
        </div>
        
        {/* Featured competitions indicator */}
        {competitions.some(comp => comp.is_featured) && (
          <div className="flex items-center space-x-1 text-sm text-yellow-600">
            <span className="text-yellow-500">⭐</span>
            <span>Featured competitions included</span>
          </div>
        )}
      </div>

      {/* Grid layout */}
      <div className={cn('grid gap-6', getGridColumns())}>
        {competitions.map((competition) => (
          <CompetitionCard
            key={competition.id}
            competition={competition}
            variant={variant}
          />
        ))}
      </div>

      {/* Load more placeholder - can be expanded later */}
      {competitions.length >= 9 && (
        <div className="flex justify-center pt-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Showing {competitions.length} competitions
            </p>
            <div className="text-sm text-gray-500">
              Use filters to narrow down results
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompetitionGrid 