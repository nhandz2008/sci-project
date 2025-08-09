'use client';

import { useState } from 'react';
import { CompetitionCreate } from '../app/api/competitions';

interface CreateCompetitionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompetitionCreate) => void;
  isLoading?: boolean;
}

export default function CreateCompetitionForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false 
}: CreateCompetitionFormProps) {
  const [formData, setFormData] = useState<CompetitionCreate>({
    title: '',
    introduction: '',
    question_type: '',
    selection_process: '',
    history: '',
    scoring_and_format: '',
    awards: '',
    penalties_and_bans: '',
    notable_achievements: '',
    competition_link: '',
    background_image_url: '',
    detail_image_urls: [],
    location: '',
    format: 'ONLINE',
    scale: 'PROVINCIAL',
    registration_deadline: '',
    size: undefined,
    target_age_min: undefined,
    target_age_max: undefined,
  });

  const handleInputChange = (field: keyof CompetitionCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      title: '',
      introduction: '',
      question_type: '',
      selection_process: '',
      history: '',
      scoring_and_format: '',
      awards: '',
      penalties_and_bans: '',
      notable_achievements: '',
      competition_link: '',
      background_image_url: '',
      detail_image_urls: [],
      location: '',
      format: 'ONLINE',
      scale: 'PROVINCIAL',
      registration_deadline: '',
      size: undefined,
      target_age_min: undefined,
      target_age_max: undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Competition</h2>
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
                  value={formData.title}
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
                  placeholder="Brief history of the competition..."
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
                  Awards and Prizes
                </label>
                <textarea
                  id="awards"
                  value={formData.awards || ''}
                  onChange={(e) => handleInputChange('awards', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the awards, prizes, and recognition..."
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
                  placeholder="Rules regarding penalties, disqualifications, and bans..."
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
                  placeholder="Highlight notable achievements, winners, or alumni..."
                />
              </div>
            </div>

            {/* Links and Media */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Links and Media</h3>
              
              <div>
                <label htmlFor="competition_link" className="block text-sm font-medium text-gray-700 mb-1">
                  Competition Website
                </label>
                <input
                  type="url"
                  id="competition_link"
                  value={formData.competition_link || ''}
                  onChange={(e) => handleInputChange('competition_link', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
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

            {/* Location and Format */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location & Format</h3>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City, Country"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                    Format
                  </label>
                  <select
                    id="format"
                    value={formData.format}
                    onChange={(e) => handleInputChange('format', e.target.value as 'ONLINE' | 'OFFLINE' | 'HYBRID')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ONLINE">Online</option>
                    <option value="OFFLINE">Offline</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="scale" className="block text-sm font-medium text-gray-700 mb-1">
                    Scale
                  </label>
                  <select
                    id="scale"
                    value={formData.scale}
                    onChange={(e) => handleInputChange('scale', e.target.value as 'PROVINCIAL' | 'REGIONAL' | 'INTERNATIONAL')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="PROVINCIAL">Provincial</option>
                    <option value="REGIONAL">Regional</option>
                    <option value="INTERNATIONAL">International</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dates, Size and Target Age */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Dates, Size & Target Audience</h3>
              
              <div>
                <label htmlFor="registration_deadline" className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Deadline
                </label>
                <input
                  type="date"
                  id="registration_deadline"
                  value={formData.registration_deadline || ''}
                  onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    placeholder="e.g., 1000"
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
                    placeholder="e.g., 13"
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
                    placeholder="e.g., 18"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  'Create Competition'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 