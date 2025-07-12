import React from 'react'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { Calendar, MapPin, Star, Clock } from 'lucide-react'
import type { CompetitionCard as CompetitionCardType, CompetitionPublic } from '@/types'
import { cn } from '@/utils'

interface CompetitionCardProps {
  competition: CompetitionCardType | CompetitionPublic
  variant?: 'default' | 'featured' | 'compact'
  className?: string
}

const CompetitionCard: React.FC<CompetitionCardProps> = ({ 
  competition, 
  variant = 'default',
  className 
}) => {
  const handleClick = () => {
    // Track click event for analytics
    console.log('Competition card clicked:', competition.id)
  }

  const getScaleColor = (scale: string) => {
    switch (scale) {
      case 'international':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'national':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'regional':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'local':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScaleLabel = (scale: string) => {
    return scale.charAt(0).toUpperCase() + scale.slice(1)
  }

  const formatDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const now = new Date()
    const daysDiff = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff < 0) {
      return 'Deadline passed'
    } else if (daysDiff === 0) {
      return 'Deadline today'
    } else if (daysDiff === 1) {
      return 'Deadline tomorrow'
    } else if (daysDiff <= 7) {
      return `${daysDiff} days left`
    } else {
      return format(deadlineDate, 'MMM d, yyyy')
    }
  }

  const isDeadlineClose = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const now = new Date()
    const daysDiff = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff <= 7 && daysDiff >= 0
  }

  const isPastDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const now = new Date()
    return deadlineDate < now
  }

  return (
    <Link
      to="/competitions/$competitionId"
      params={{ competitionId: competition.id.toString() }}
      onClick={handleClick}
      className={cn(
        'group block bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200',
        'border border-gray-200 hover:border-gray-300 overflow-hidden',
        'transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500',
        variant === 'featured' && 'ring-2 ring-blue-500 ring-opacity-50',
        variant === 'compact' && 'flex flex-row items-center space-x-4 p-4',
        variant !== 'compact' && 'flex flex-col',
        className
      )}
      tabIndex={0}
      aria-label={`View competition: ${competition.title}`}
    >
      {/* Image Section */}
      <div className={cn(
        'relative overflow-hidden',
        variant === 'compact' ? 'w-24 h-24 flex-shrink-0' : 'w-full h-48'
      )}>
        {competition.image_url ? (
          <img
            src={competition.image_url}
            alt={competition.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-blue-600 font-medium">Competition</p>
            </div>
          </div>
        )}
        
        {/* Featured Badge */}
        {competition.is_featured && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Star className="w-3 h-3 mr-1" />
            Featured
          </div>
        )}
        
        {/* Scale Badge */}
        <div className={cn(
          'absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium border',
          getScaleColor(competition.scale)
        )}>
          {getScaleLabel(competition.scale)}
        </div>
      </div>

      {/* Content Section */}
      <div className={cn(
        'flex flex-col justify-between',
        variant === 'compact' ? 'flex-1 min-w-0' : 'p-4 flex-1'
      )}>
        <div>
          <h3 className={cn(
            'font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors',
            variant === 'compact' ? 'text-sm mb-1' : 'text-lg mb-2'
          )}>
            {competition.title}
          </h3>
          
          <div className={cn(
            'flex items-center text-gray-600 mb-2',
            variant === 'compact' ? 'text-xs' : 'text-sm'
          )}>
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{competition.location}</span>
          </div>
        </div>

        {/* Registration Deadline */}
        <div className={cn(
          'flex items-center text-sm',
          isDeadlineClose(competition.registration_deadline) ? 'text-orange-600' : 'text-gray-500',
          isPastDeadline(competition.registration_deadline) ? 'text-red-600' : '',
          variant === 'compact' && 'text-xs'
        )}>
          <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="font-medium">
            {formatDeadline(competition.registration_deadline)}
          </span>
        </div>

        {/* Urgent deadline indicator */}
        {isDeadlineClose(competition.registration_deadline) && (
          <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
            ⚠️ Registration closes soon!
          </div>
        )}
      </div>
    </Link>
  )
}

export default CompetitionCard 