'use client';

import React from 'react';
import { Competition } from '../app/api/competitions';
import LikeButton from './like-button';
import Breadcrumb from './breadcrumb';

interface CompetitionDetailsProps {
  competition: Competition;
}

const CompetitionDetails: React.FC<CompetitionDetailsProps> = ({ competition }) => {
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
    return format.charAt(0).toUpperCase() + format.slice(1);
  };

  const getScaleDisplay = (scale?: string) => {
    if (!scale) return 'Not specified';
    return scale.charAt(0).toUpperCase() + scale.slice(1);
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
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Competition Information */}
            {(competition.introduction || competition.question_type || competition.selection_process || 
              competition.history || competition.scoring_and_format || competition.awards || 
              competition.penalties_and_bans || competition.notable_achievements) && (
              <div className="rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">About this Competition</h2>
                <div className="space-y-6">
                  {/* Introduction */}
                  {competition.introduction && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                      <div className="prose prose-lg max-w-none text-gray-700">
                        <p className="leading-relaxed">{competition.introduction}</p>
                      </div>
                    </div>
                  )}

                  {/* Question Type */}
                  {competition.question_type && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Question Type</h3>
                      <div className="prose prose-lg max-w-none text-gray-700">
                        <p className="leading-relaxed">{competition.question_type}</p>
                      </div>
                    </div>
                  )}

                  {/* Selection Process */}
                  {competition.selection_process && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Selection Process</h3>
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Scoring and Format</h3>
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Penalties and Bans</h3>
                      <div className="prose prose-lg max-w-none text-gray-700">
                        <p className="leading-relaxed">{competition.penalties_and_bans}</p>
                      </div>
                    </div>
                  )}

                  {/* Notable Achievements */}
                  {competition.notable_achievements && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Notable Achievements</h3>
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
            {/* Quick Facts */}
            <div className="rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Facts</h3>
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
                    <p className="text-sm text-gray-500">Age Range</p>
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">Links & Information</h3>
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
                        text: competition.introduction || '',
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
    </div>
  );
};

export default CompetitionDetails; 