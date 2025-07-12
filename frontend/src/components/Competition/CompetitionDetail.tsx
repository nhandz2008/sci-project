import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Trophy, 
  Users, 
  BookOpen, 
  ExternalLink,
  Star,
  Share2,
  Edit,
  Trash2,
  AlertCircle 
} from 'lucide-react'
import { CompetitionWithCreator } from '@/types'
import { cn, getDaysUntil, isFutureDate } from '@/utils'
import { useAuth } from '@/hooks/useAuth'

interface CompetitionDetailProps {
  competition: CompetitionWithCreator
  className?: string
}

const CompetitionDetail: React.FC<CompetitionDetailProps> = ({
  competition,
  className,
}) => {
  const { user } = useAuth()
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      const deadline = new Date(competition.registration_deadline)
      const now = new Date()
      const timeDiff = deadline.getTime() - now.getTime()

      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft(null)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [competition.registration_deadline])

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

  const canEdit = user && (user.role === 'admin' || user.id === competition.created_by)
  const isRegistrationOpen = isFutureDate(competition.registration_deadline)
  const daysUntilDeadline = getDaysUntil(competition.registration_deadline)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: competition.title,
          text: `Check out this competition: ${competition.title}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      } catch (error) {
        console.log('Error copying to clipboard:', error)
      }
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Section */}
      <div className="relative">
        {/* Competition Image */}
        <div className="h-64 md:h-80 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg overflow-hidden">
          {competition.image_url ? (
            <img
              src={competition.image_url}
              alt={competition.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <p className="text-blue-600 font-medium">Science Competition</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={handleShare}
            className="bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-lg hover:bg-white transition-colors"
            title="Share competition"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex space-x-2">
          {competition.is_featured && (
            <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <Star className="w-4 h-4 mr-1" />
              Featured
            </div>
          )}
          <div className={cn(
            'px-3 py-1 rounded-full text-sm font-medium border',
            getScaleColor(competition.scale)
          )}>
            {getScaleLabel(competition.scale)}
          </div>
        </div>
      </div>

      {/* Title and Basic Info */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{competition.title}</h1>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{competition.location}</span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>by {competition.creator_username}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Created {format(new Date(competition.created_at), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Registration Countdown */}
      {isRegistrationOpen && timeLeft && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Registration Deadline
            </h3>
            <div className="flex justify-center space-x-4 mb-4">
              <div className="text-center">
                <div className="bg-blue-600 text-white text-2xl font-bold py-2 px-4 rounded-lg">
                  {timeLeft.days}
                </div>
                <div className="text-sm text-blue-800 mt-1">Days</div>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white text-2xl font-bold py-2 px-4 rounded-lg">
                  {timeLeft.hours}
                </div>
                <div className="text-sm text-blue-800 mt-1">Hours</div>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white text-2xl font-bold py-2 px-4 rounded-lg">
                  {timeLeft.minutes}
                </div>
                <div className="text-sm text-blue-800 mt-1">Minutes</div>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white text-2xl font-bold py-2 px-4 rounded-lg">
                  {timeLeft.seconds}
                </div>
                <div className="text-sm text-blue-800 mt-1">Seconds</div>
              </div>
            </div>
            <p className="text-blue-700">
              Registration closes on {format(new Date(competition.registration_deadline), 'PPPp')}
            </p>
          </div>
        </div>
      )}

      {/* Registration Closed Warning */}
      {!isRegistrationOpen && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700 font-medium">
              Registration closed on {format(new Date(competition.registration_deadline), 'PPP')}
            </p>
          </div>
        </div>
      )}

      {/* Register Button */}
      {competition.external_url && (
        <div className="text-center">
          <a
            href={competition.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center px-6 py-3 text-lg font-medium rounded-lg transition-colors',
              isRegistrationOpen
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-400 text-gray-700 cursor-not-allowed'
            )}
            {...(!isRegistrationOpen && { 'aria-disabled': true })}
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            {isRegistrationOpen ? 'Register Now' : 'Registration Closed'}
          </a>
        </div>
      )}

      {/* Competition Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Competition Information */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Competition Details</h3>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Start Date</p>
                <p className="text-gray-600">{format(new Date(competition.start_date), 'PPP')}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">End Date</p>
                <p className="text-gray-600">{format(new Date(competition.end_date), 'PPP')}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Registration Deadline</p>
                <p className="text-gray-600">{format(new Date(competition.registration_deadline), 'PPP')}</p>
              </div>
            </div>
            
            {competition.target_age_min && competition.target_age_max && (
              <div className="flex items-start">
                <Users className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Age Range</p>
                  <p className="text-gray-600">
                    {competition.target_age_min} - {competition.target_age_max} years
                  </p>
                </div>
              </div>
            )}
            
            {competition.required_grade_min && competition.required_grade_max && (
              <div className="flex items-start">
                <BookOpen className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Grade Level</p>
                  <p className="text-gray-600">
                    Grades {competition.required_grade_min} - {competition.required_grade_max}
                  </p>
                </div>
              </div>
            )}
            
            {competition.subject_areas && (
              <div className="flex items-start">
                <BookOpen className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Subject Areas</p>
                  <p className="text-gray-600">{competition.subject_areas}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prize Information */}
        {competition.prize_structure && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Prizes</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <Trophy className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Prize Structure</p>
                  <p className="text-yellow-800 mt-1 whitespace-pre-line">
                    {competition.prize_structure}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Description</h3>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {competition.description}
          </p>
        </div>
      </div>

      {/* Eligibility Criteria */}
      {competition.eligibility_criteria && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Eligibility</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 whitespace-pre-line">
              {competition.eligibility_criteria}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompetitionDetail 