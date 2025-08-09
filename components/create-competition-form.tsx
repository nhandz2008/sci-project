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
    description: '',
    competition_link: '',
    image_url: '',
    location: '',
    format: 'online',
    scale: 'provincial',
    registration_deadline: '',
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
      description: '',
      competition_link: '',
      image_url: '',
      location: '',
      format: 'online',
      scale: 'provincial',
      registration_deadline: '',
      target_age_min: undefined,
      target_age_max: undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the competition..."
                />
              </div>

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
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  id="image_url"
                  value={formData.image_url || ''}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
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
                    onChange={(e) => handleInputChange('format', e.target.value as 'online' | 'offline' | 'hybrid')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="scale" className="block text-sm font-medium text-gray-700 mb-1">
                    Scale
                  </label>
                  <select
                    id="scale"
                    value={formData.scale}
                    onChange={(e) => handleInputChange('scale', e.target.value as 'provincial' | 'regional' | 'international')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="provincial">Provincial</option>
                    <option value="regional">Regional</option>
                    <option value="international">International</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dates and Target Age */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Dates & Target Audience</h3>
              
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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