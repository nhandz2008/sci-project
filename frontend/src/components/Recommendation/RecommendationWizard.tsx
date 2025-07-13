import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { recommendationAPI } from '../../client/api'
import { RecommendationUserProfile, RecommendationResponse } from '../../types'

interface RecommendationWizardProps {
  isOpen: boolean
  onClose: () => void
}

interface ProfileStep {
  step: number
  title: string
  description: string
  fields: string[]
  isRequired: boolean
}

const PROFILE_STEPS: ProfileStep[] = [
  {
    step: 1,
    title: "Basic Information",
    description: "Tell us about yourself to get started",
    fields: ["age", "grade", "school_level"],
    isRequired: true
  },
  {
    step: 2,
    title: "Academic Profile", 
    description: "Help us understand your academic background",
    fields: ["gpa", "subjects", "achievements"],
    isRequired: false
  },
  {
    step: 3,
    title: "Interests & Goals",
    description: "What areas of science interest you most?",
    fields: ["interests", "career_goals", "preferred_scale"],
    isRequired: true
  },
  {
    step: 4,
    title: "Preferences",
    description: "Final preferences for your perfect competition",
    fields: ["location_preference", "time_commitment", "team_preference"],
    isRequired: false
  }
]

const INTEREST_OPTIONS = [
  "Robotics & Engineering",
  "Computer Science & Programming", 
  "Biology & Life Sciences",
  "Chemistry & Materials Science",
  "Physics & Astronomy",
  "Mathematics & Statistics",
  "Environmental Science",
  "Medicine & Healthcare",
  "Space & Aerospace",
  "Artificial Intelligence",
  "Renewable Energy",
  "Data Science"
]

const SCALE_OPTIONS = ["local", "regional", "national", "international"]
const SCHOOL_LEVELS = ["Elementary", "Middle School", "High School", "College"]

export const RecommendationWizard: React.FC<RecommendationWizardProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [userProfile, setUserProfile] = useState<Partial<RecommendationUserProfile>>({})
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  const recommendationMutation = useMutation({
    mutationFn: async (profile: RecommendationUserProfile) => {
      const response = await recommendationAPI.getRecommendations({
        user_profile: profile,
        max_recommendations: 5,
        include_explanation: true
      })
      return response
    },
    onSuccess: (data: RecommendationResponse) => {
      setRecommendations(data)
      setCurrentStep(5) // Move to results step
    },
    onError: (error) => {
      console.error('Failed to get recommendations:', error)
      alert('Failed to get recommendations. Please try again.')
    }
  })

  const handleProfileUpdate = (field: string, value: any) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest)
      } else {
        return [...prev, interest]
      }
    })
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1)
    } else {
      // Submit profile for recommendations
      const completeProfile: RecommendationUserProfile = {
        ...userProfile,
        interests: selectedInterests
      } as RecommendationUserProfile
      
      recommendationMutation.mutate(completeProfile)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleReset = () => {
    setCurrentStep(1)
    setUserProfile({})
    setSelectedInterests([])
    setRecommendations(null)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <input
                type="number"
                min="5"
                max="25"
                value={userProfile.age || ''}
                onChange={(e) => handleProfileUpdate('age', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your age"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Level *
              </label>
              <select
                value={userProfile.school_level || ''}
                onChange={(e) => handleProfileUpdate('school_level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select your school level</option>
                {SCHOOL_LEVELS.map(level => (
                  <option key={level} value={level.toLowerCase()}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={userProfile.grade || ''}
                onChange={(e) => handleProfileUpdate('grade', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your grade (1-12)"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPA (Optional)
              </label>
              <input
                type="number"
                min="0"
                max="4"
                step="0.1"
                value={userProfile.gpa || ''}
                onChange={(e) => handleProfileUpdate('gpa', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your GPA (0.0-4.0)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favorite Subjects
              </label>
              <textarea
                value={userProfile.subjects || ''}
                onChange={(e) => handleProfileUpdate('subjects', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Physics, Biology, Computer Science"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Achievements
              </label>
              <textarea
                value={userProfile.achievements || ''}
                onChange={(e) => handleProfileUpdate('achievements', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Science fair winner, Math Olympiad participant"
                rows={3}
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Areas of Interest * (Select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {INTEREST_OPTIONS.map(interest => (
                  <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedInterests.includes(interest)}
                      onChange={() => handleInterestToggle(interest)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{interest}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Competition Scale
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SCALE_OPTIONS.map(scale => (
                  <label key={scale} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.preferred_scale?.includes(scale) || false}
                      onChange={(e) => {
                        const current = userProfile.preferred_scale || []
                        const updated = e.target.checked 
                          ? [...current, scale]
                          : current.filter(s => s !== scale)
                        handleProfileUpdate('preferred_scale', updated)
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{scale}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Preference
              </label>
              <select
                value={userProfile.location_preference || ''}
                onChange={(e) => handleProfileUpdate('location_preference', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No preference</option>
                <option value="local">Local competitions</option>
                <option value="regional">Regional competitions</option>
                <option value="national">National competitions</option>
                <option value="international">International competitions</option>
                <option value="remote">Online/Remote competitions</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Commitment Preference
              </label>
              <select
                value={userProfile.time_commitment || ''}
                onChange={(e) => handleProfileUpdate('time_commitment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No preference</option>
                <option value="low">Low (1-5 hours/week)</option>
                <option value="medium">Medium (5-15 hours/week)</option>
                <option value="high">High (15+ hours/week)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team vs Individual Preference
              </label>
              <select
                value={userProfile.team_preference || ''}
                onChange={(e) => handleProfileUpdate('team_preference', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No preference</option>
                <option value="individual">Individual competitions</option>
                <option value="team">Team competitions</option>
                <option value="both">Both individual and team</option>
              </select>
            </div>
          </div>
        )

      case 5:
        return <RecommendationResults recommendations={recommendations} onReset={handleReset} />

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return userProfile.age && userProfile.school_level
      case 2:
        return true // Optional step
      case 3:
        return selectedInterests.length > 0
      case 4:
        return true // Optional step
      default:
        return false
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Find Your Perfect Competition
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Indicator */}
          {currentStep <= 4 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Step {currentStep} of 4
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round((currentStep / 4) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Step Title */}
          {currentStep <= 4 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {PROFILE_STEPS[currentStep - 1]?.title}
              </h3>
              <p className="text-gray-600 mt-1">
                {PROFILE_STEPS[currentStep - 1]?.description}
              </p>
            </div>
          )}

          {/* Step Content */}
          <div className="mb-6">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          {currentStep <= 4 && (
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              
              <button
                onClick={handleNext}
                disabled={!canProceed() || recommendationMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {recommendationMutation.isPending ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Finding Recommendations...
                  </span>
                ) : currentStep === 4 ? 'Get Recommendations' : 'Next'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Recommendation Results Component
interface RecommendationResultsProps {
  recommendations: RecommendationResponse | null
  onReset: () => void
}

const RecommendationResults: React.FC<RecommendationResultsProps> = ({ recommendations, onReset }) => {
  if (!recommendations) return null

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Your Personalized Recommendations
        </h3>
        <p className="text-blue-700 text-sm">
          Based on your profile, we analyzed {recommendations.total_competitions_analyzed} competitions 
          and found {recommendations.recommendations.length} perfect matches for you.
        </p>
        {recommendations.stats && (
          <div className="mt-3 text-sm text-blue-600">
            <p>Average match score: {(recommendations.stats.average_match_score * 100).toFixed(1)}%</p>
            <p>Recommendation quality: {recommendations.stats.recommendation_quality}</p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        {recommendations.recommendations.map((rec, index) => (
          <div key={rec.competition.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">
                  {index + 1}. {rec.competition.title}
                </h4>
                <p className="text-gray-600 text-sm">
                  {rec.competition.location} • {rec.competition.scale}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {(rec.match_score * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">Match Score</div>
              </div>
            </div>
            
            {/* Match Reasons */}
            <div className="mb-3">
              <h5 className="text-sm font-medium text-gray-700 mb-1">Why this competition matches you:</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {rec.match_reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Actions */}
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                View Details
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50">
                Save to Favorites
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reset Button */}
      <div className="text-center pt-4">
        <button
          onClick={onReset}
          className="px-6 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
        >
          Start Over
        </button>
      </div>
    </div>
  )
} 