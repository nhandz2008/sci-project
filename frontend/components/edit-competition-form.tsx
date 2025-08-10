'use client';

import { useState, useEffect, useRef } from 'react';
import { CompetitionUpdate, Competition, competitionsAPI } from '../app/api/competitions';

interface EditCompetitionFormProps {
  isOpen: boolean;
  onClose: () => void;
  competition: Competition | null;
  onUpdate: (updatedCompetition: Competition) => void;
  isLoading?: boolean;
}

export default function EditCompetitionForm({
  isOpen,
  onClose,
  competition,
  onUpdate,
  isLoading = false
}: EditCompetitionFormProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<CompetitionUpdate>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when competition changes
  useEffect(() => {
    if (competition) {
      setFormData({
        title: competition.title,
        introduction: competition.introduction,
        overview: competition.overview,
        question_type: competition.question_type,
        selection_process: competition.selection_process,
        history: competition.history,
        scoring_and_format: competition.scoring_and_format,
        awards: competition.awards,
        penalties_and_bans: competition.penalties_and_bans,
        notable_achievements: competition.notable_achievements,
        competition_link: competition.competition_link,
        background_image_url: competition.background_image_url,
        detail_image_urls: competition.detail_image_urls,
        location: competition.location,
        format: competition.format,
        scale: competition.scale,
        registration_deadline: competition.registration_deadline,
        size: competition.size,
        target_age_min: competition.target_age_min,
        target_age_max: competition.target_age_max,
      });
    }
  }, [competition]);

  const handleInputChange = (field: keyof CompetitionUpdate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competition) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const updatedCompetition = await competitionsAPI.updateCompetition(competition.id, formData);
      onUpdate(updatedCompetition);
      handleClose();
    } catch (error) {
      console.error('Error updating competition:', error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to update competition. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle click outside modal
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      handleClose();
    }
  };

  if (!isOpen || !competition) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Competition</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close form"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Competition Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Enter competition title"
                />
              </div>

              <div>
                <label htmlFor="introduction" className="block text-sm font-medium text-gray-700 mb-1">
                  Introduction/Description
                </label>
                <textarea
                  id="introduction"
                  value={formData.introduction || ''}
                  onChange={(e) => handleInputChange('introduction', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide a comprehensive description of the competition..."
                />
              </div>

              <div>
                <label htmlFor="overview" className="block text-sm font-medium text-gray-700 mb-1">
                  Overview (Optional)
                </label>
                <textarea
                  id="overview"
                  value={formData.overview || ''}
                  onChange={(e) => handleInputChange('overview', e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide a comprehensive overview of the competition (max 2000 characters)..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.overview?.length || 0}/2000 characters
                </p>
              </div>

              <div>
                <label htmlFor="question_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Question Type
                </label>
                <input
                  type="text"
                  id="question_type"
                  value={formData.question_type || ''}
                  onChange={(e) => handleInputChange('question_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Multiple choice, Essay, Practical, etc."
                />
              </div>

              <div>
                <label htmlFor="selection_process" className="block text-sm font-medium text-gray-700 mb-1">
                  Selection Process
                </label>
                <textarea
                  id="selection_process"
                  value={formData.selection_process || ''}
                  onChange={(e) => handleInputChange('selection_process', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe how participants are selected..."
                />
              </div>
            </div>

            {/* Competition Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Competition Details</h3>

              <div>
                <label htmlFor="history" className="block text-sm font-medium text-gray-700 mb-1">
                  History
                </label>
                <textarea
                  id="history"
                  value={formData.history || ''}
                  onChange={(e) => handleInputChange('history', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the history and background of the competition..."
                />
              </div>

              <div>
                <label htmlFor="scoring_and_format" className="block text-sm font-medium text-gray-700 mb-1">
                  Scoring and Format
                </label>
                <textarea
                  id="scoring_and_format"
                  value={formData.scoring_and_format || ''}
                  onChange={(e) => handleInputChange('scoring_and_format', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Explain the scoring system and competition format..."
                />
              </div>

              <div>
                <label htmlFor="awards" className="block text-sm font-medium text-gray-700 mb-1">
                  Awards
                </label>
                <textarea
                  id="awards"
                  value={formData.awards || ''}
                  onChange={(e) => handleInputChange('awards', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the awards and prizes..."
                />
              </div>

              <div>
                <label htmlFor="penalties_and_bans" className="block text-sm font-medium text-gray-700 mb-1">
                  Penalties and Bans
                </label>
                <textarea
                  id="penalties_and_bans"
                  value={formData.penalties_and_bans || ''}
                  onChange={(e) => handleInputChange('penalties_and_bans', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe any penalties, bans, or rules violations..."
                />
              </div>

              <div>
                <label htmlFor="notable_achievements" className="block text-sm font-medium text-gray-700 mb-1">
                  Notable Achievements
                </label>
                <textarea
                  id="notable_achievements"
                  value={formData.notable_achievements || ''}
                  onChange={(e) => handleInputChange('notable_achievements', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Highlight notable achievements and success stories..."
                />
              </div>
            </div>

            {/* Competition Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Competition Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="e.g., Online, New York, USA"
                  />
                </div>

                <div>
                  <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                    Format *
                  </label>
                  <select
                    id="format"
                    value={formData.format || 'ONLINE'}
                    onChange={(e) => handleInputChange('format', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="ONLINE">Online</option>
                    <option value="OFFLINE">Offline</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="scale" className="block text-sm font-medium text-gray-700 mb-1">
                    Scale *
                  </label>
                  <select
                    id="scale"
                    value={formData.scale || 'PROVINCIAL'}
                    onChange={(e) => handleInputChange('scale', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="PROVINCIAL">Provincial</option>
                    <option value="REGIONAL">Regional</option>
                    <option value="INTERNATIONAL">International</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="registration_deadline" className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    id="registration_deadline"
                    value={formData.registration_deadline ? new Date(formData.registration_deadline).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Size
                  </label>
                  <input
                    type="number"
                    id="size"
                    value={formData.size || ''}
                    onChange={(e) => handleInputChange('size', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Expected number of participants"
                    min="1"
                  />
                </div>

                <div>
                  <label htmlFor="target_age_min" className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Age
                  </label>
                  <input
                    type="number"
                    id="target_age_min"
                    value={formData.target_age_min || ''}
                    onChange={(e) => handleInputChange('target_age_min', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Minimum age requirement"
                    min="0"
                  />
                </div>

                <div>
                  <label htmlFor="target_age_max" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Age
                  </label>
                  <input
                    type="number"
                    id="target_age_max"
                    value={formData.target_age_max || ''}
                    onChange={(e) => handleInputChange('target_age_max', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Maximum age requirement"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Links and Media */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Links and Media</h3>

              <div>
                <label htmlFor="competition_link" className="block text-sm font-medium text-gray-700 mb-1">
                  Competition Link
                </label>
                <input
                  type="url"
                  id="competition_link"
                  value={formData.competition_link || ''}
                  onChange={(e) => handleInputChange('competition_link', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/competition"
                />
              </div>

              <div>
                <label htmlFor="background_image_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Background Image URL
                </label>
                <input
                  type="url"
                  id="background_image_url"
                  value={formData.background_image_url || ''}
                  onChange={(e) => handleInputChange('background_image_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  'Update Competition'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
