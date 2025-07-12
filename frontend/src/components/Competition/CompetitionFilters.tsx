import React, { useState, useEffect } from 'react'
import { Search, Filter, X, MapPin, Calendar, Users, BookOpen, Star } from 'lucide-react'
import { CompetitionFilters, CompetitionScale } from '@/types'
import { cn } from '@/utils'

interface CompetitionFiltersProps {
  filters: CompetitionFilters
  onFiltersChange: (filters: CompetitionFilters) => void
  loading?: boolean
  className?: string
}

const CompetitionFiltersComponent: React.FC<CompetitionFiltersProps> = ({
  filters,
  onFiltersChange,
  loading = false,
  className,
}) => {
  const [localFilters, setLocalFilters] = useState<CompetitionFilters>(filters)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [searchInput, setSearchInput] = useState<string>(filters.search || '')

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters)
    setSearchInput(filters.search || '')
  }, [filters])

  // Handle search input change (only update local state)
  const handleSearchInputChange = (value: string) => {
    setSearchInput(value)
  }

  // Handle search execution (button click or Enter key)
  const handleSearchExecute = () => {
    const newFilters = { ...localFilters, search: searchInput || undefined }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  // Handle search clear
  const handleSearchClear = () => {
    setSearchInput('')
    const newFilters = { ...localFilters, search: undefined }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  // Handle Enter key press in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchExecute()
    }
  }

  // Handle filter change (only update local state)
  const handleFilterChange = (key: keyof CompetitionFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
  }

  // Apply all filters
  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
  }

  // Clear all filters
  const clearAllFilters = () => {
    const emptyFilters: CompetitionFilters = {}
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  // Check if there are pending filter changes
  const hasPendingChanges = () => {
    return JSON.stringify(localFilters) !== JSON.stringify(filters)
  }

  // Cancel pending changes
  const cancelPendingChanges = () => {
    setLocalFilters(filters)
    setSearchInput(filters.search || '')
  }

  // Check if any filters are active
  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== null && value !== ''
  )

  // Get active filter count
  const activeFilterCount = Object.values(localFilters).filter(value => 
    value !== undefined && value !== null && value !== ''
  ).length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search competitions... (Press Enter or click Search)"
            value={searchInput}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className={cn(
              "w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors",
              searchInput !== (localFilters.search || '') 
                ? "border-orange-300 bg-orange-50" 
                : "border-gray-300"
            )}
            disabled={loading}
          />
          {searchInput && (
            <button
              onClick={handleSearchClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearchExecute}
          disabled={loading}
          className={cn(
            "px-4 py-3 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
            searchInput !== (localFilters.search || '')
              ? "bg-orange-600 hover:bg-orange-700"
              : "bg-blue-600 hover:bg-blue-700"
          )}
        >
          Search
        </button>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
          {hasPendingChanges() && (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              Pending
            </span>
          )}
        </button>
        
        <div className="flex items-center space-x-2">
          {hasPendingChanges() && (
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Apply Filters
            </button>
          )}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className={cn(
          "border rounded-lg p-4 space-y-4 transition-colors",
          hasPendingChanges() 
            ? "border-orange-300 bg-orange-50" 
            : "border-gray-200 bg-gray-50"
        )}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Competition Scale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Scale
              </label>
              <select
                value={localFilters.scale || ''}
                onChange={(e) => handleFilterChange('scale', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">All scales</option>
                <option value={CompetitionScale.LOCAL}>Local</option>
                <option value={CompetitionScale.REGIONAL}>Regional</option>
                <option value={CompetitionScale.NATIONAL}>National</option>
                <option value={CompetitionScale.INTERNATIONAL}>International</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Location
              </label>
              <input
                type="text"
                placeholder="Enter location..."
                value={localFilters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            {/* Featured Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Star className="w-4 h-4 mr-1" />
                Featured
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={localFilters.is_featured || false}
                  onChange={(e) => handleFilterChange('is_featured', e.target.checked || undefined)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="featured" className="text-sm text-gray-700">
                  Show only featured competitions
                </label>
              </div>
            </div>
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Age Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Age</label>
                <input
                  type="number"
                  placeholder="5"
                  min="5"
                  max="25"
                  value={localFilters.age_min || ''}
                  onChange={(e) => handleFilterChange('age_min', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Age</label>
                <input
                  type="number"
                  placeholder="25"
                  min="5"
                  max="25"
                  value={localFilters.age_max || ''}
                  onChange={(e) => handleFilterChange('age_max', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Grade Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              Grade Level
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Grade</label>
                <input
                  type="number"
                  placeholder="1"
                  min="1"
                  max="12"
                  value={localFilters.grade_min || ''}
                  onChange={(e) => handleFilterChange('grade_min', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Grade</label>
                <input
                  type="number"
                  placeholder="12"
                  min="1"
                  max="12"
                  value={localFilters.grade_max || ''}
                  onChange={(e) => handleFilterChange('grade_max', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Subject Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              Subject Areas
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'Biology',
                'Chemistry',
                'Physics',
                'Mathematics',
                'Computer Science',
                'Engineering',
                'Environmental Science',
                'Medicine',
                'Psychology',
                'Other'
              ].map((subject) => (
                <button
                  key={subject}
                  onClick={() => {
                    const currentSubjects = localFilters.subject_areas || []
                    const isSelected = currentSubjects.includes(subject)
                    const newSubjects = isSelected
                      ? currentSubjects.filter(s => s !== subject)
                      : [...currentSubjects, subject]
                    handleFilterChange('subject_areas', newSubjects.length > 0 ? newSubjects : undefined)
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm border transition-colors',
                    (localFilters.subject_areas || []).includes(subject)
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  )}
                  disabled={loading}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          {/* Apply/Cancel Footer */}
          {hasPendingChanges() && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                You have unsaved filter changes
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={cancelPendingChanges}
                  disabled={loading}
                  className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyFilters}
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {localFilters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              Search: "{localFilters.search}"
              <button
                onClick={handleSearchClear}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {localFilters.scale && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              Scale: {localFilters.scale}
              <button
                onClick={() => handleFilterChange('scale', undefined)}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {localFilters.location && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
              Location: {localFilters.location}
              <button
                onClick={() => handleFilterChange('location', undefined)}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {localFilters.is_featured && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
              Featured only
              <button
                onClick={() => handleFilterChange('is_featured', undefined)}
                className="ml-1 text-yellow-600 hover:text-yellow-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default CompetitionFiltersComponent 