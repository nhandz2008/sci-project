'use client';

import React, { useState } from 'react';
import { Competition } from '../app/api/competitions';
import { useAuth } from '../app/contexts/AuthContext';
import { useMode } from '../app/contexts/ModeContext';
import { canEditCompetitionInCreatorsMode } from '../app/utils/permissions';
import LikeButton from './like-button';
import Breadcrumb from './breadcrumb';
import CountdownClock from './countdown-clock';
import EditCompetitionForm from './edit-competition-form';

interface CompetitionDetailsProps {
  competition: Competition;
}

const CompetitionDetails: React.FC<CompetitionDetailsProps> = ({ competition }) => {
  const { user } = useAuth();
  const { isCreatorsMode } = useMode();
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAgeRange = (min?: number, max?: number) => {
    if (!min && !max) return 'All ages';
    if (min && max) return `${min}-${max} years`;
    if (min) return `${min}+ years`;
    if (max) return `Up to ${max} years`;
    return 'All ages';
  };

  const getFormatDisplay = (format?: string) => {
    if (!format) return 'Not specified';
    return format.charAt(0).toUpperCase() + format.slice(1).toLowerCase();
  };

  const getScaleDisplay = (scale?: string) => {
    if (!scale) return 'Not specified';
    return scale.charAt(0).toUpperCase() + scale.slice(1).toLowerCase();
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const isDeadlineInFuture = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    return deadlineDate.getTime() > now.getTime();
  };

  const handleEditCompetition = () => {
    setEditingCompetition(competition);
    setIsEditFormOpen(true);
  };

  const handleUpdateCompetition = (updatedCompetition: Competition) => {
    // Refresh the page to show updated data
    window.location.reload();
  };



  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Competitions', href: '/competitions' },
              { label: competition.title }
            ]}
          />
        </div>

        {/* Header Section */}
        <div className="rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="relative">
            {/* Hero Image */}
            {competition.background_image_url && (
              <div className="h-64 relative">
                <img
                  src={competition.background_image_url}
                  alt={competition.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              </div>
            )}

            {/* Header Content */}
            <div className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    {getStatusBadge(competition.is_active)}
                  </div>

                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                    {competition.title}
                  </h1>

                  {competition.location && (
                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-lg">{competition.location}</span>
                    </div>
                  )}

                  <LikeButton competitionId={competition.id} competition={competition} />
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-3">
                  {competition.competition_link && (
                    <a
                      href={competition.competition_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Visit Official Site
                    </a>
                  )}

                  {canEditCompetitionInCreatorsMode(user, competition, isCreatorsMode) && (
                    <button
                      onClick={handleEditCompetition}
                      className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Competition
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Detail Images */}
            {competition.detail_image_urls && competition.detail_image_urls.length > 0 && (
              <div className="rounded-xl shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Competition Images</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {competition.detail_image_urls.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`${competition.title} detail ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer shadow-md"
                        onClick={() => {
                          // Open image in new tab or modal
                          window.open(imageUrl, '_blank');
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Competition Information */}
            {(competition.overview || competition.question_type || competition.selection_process ||
              competition.history || competition.scoring_and_format || competition.awards ||
              competition.penalties_and_bans || competition.notable_achievements) && (
              <div className="rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">About this competition</h2>
                <div className="space-y-6">
                  {/* Overview */}
                  {competition.overview && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Overview</h3>
                      <div className="prose prose-lg max-w-none text-gray-700">
                        <p className="leading-relaxed">{competition.overview}</p>
                      </div>
                    </div>
                  )}

                  {/* Question Type */}
                  {competition.question_type && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Question type</h3>
                      <div className="prose prose-lg max-w-none text-gray-700">
                        <p className="leading-relaxed">{competition.question_type}</p>
                      </div>
                    </div>
                  )}

                  {/* Selection Process */}
                  {competition.selection_process && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Selection process</h3>
                      <div className="prose prose-lg max-w-none text-gray-700">
                        <p className="leading-relaxed">{competition.selection_process}</p>
                      </div>
                    </div>
                  )}

                  {/* History */}
                  {competition.history && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">History</h3>
                      <div className="prose prose-lg max-w-none text-gray-700">
                        <p className="leading-relaxed">{competition.history}</p>
                      </div>
                    </div>
                  )}

                  {/* Scoring and Format */}
                  {competition.scoring_and_format && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Scoring and format</h3>
                      <div className="prose prose-lg max-w-none text-gray-700">
                        <p className="leading-relaxed">{competition.scoring_and_format}</p>
                      </div>
                    </div>
                  )}

                  {/* Awards */}
                  {competition.awards && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Awards</h3>
                      <div className="prose prose-lg max-w-none text-gray-700">
                        <p className="leading-relaxed">{competition.awards}</p>
                      </div>
                    </div>
                  )}

                  {/* Penalties and Bans */}
                  {competition.penalties_and_bans && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Penalties and bans</h3>
                      <div className="prose prose-lg max-w-none text-gray-700">
                        <p className="leading-relaxed">{competition.penalties_and_bans}</p>
                      </div>
                    </div>
                  )}

                  {/* Notable Achievements */}
                  {competition.notable_achievements && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Notable achievements</h3>
                      <div className="prose prose-lg max-w-none text-gray-700">
                        <p className="leading-relaxed">{competition.notable_achievements}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Countdown Clock */}
            {competition.registration_deadline && isDeadlineInFuture(competition.registration_deadline) && (
              <CountdownClock deadline={competition.registration_deadline} />
            )}

            {/* Quick Facts */}
            <div className="rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick facts</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm text-gray-500">Format</p>
                    <p className="font-semibold text-gray-900">{getFormatDisplay(competition.format)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm text-gray-500">Scale</p>
                    <p className="font-semibold text-gray-900">{getScaleDisplay(competition.scale)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="text-sm text-gray-500">Age range</p>
                    <p className="font-semibold text-gray-900">
                      {formatAgeRange(competition.target_age_min, competition.target_age_max)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="text-sm text-gray-500">Deadline</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(competition.registration_deadline)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Links */}
            <div className="rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Links & information</h3>
              <div className="space-y-3">
                {competition.competition_link && (
                  <a
                    href={competition.competition_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">Official Website</span>
                  </a>
                )}
              </div>
            </div>

            {/* Share */}
            <div className="rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Share</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: competition.title,
                        text: competition.overview || competition.introduction || '',
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      // You could add a toast notification here
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Competition Form Modal */}
      <EditCompetitionForm
        isOpen={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setEditingCompetition(null);
        }}
        competition={editingCompetition}
        onUpdate={handleUpdateCompetition}
        isLoading={false}
      />
    </div>
  );
};

export default CompetitionDetails;
