'use client';

import React from 'react';
import Link from 'next/link';
import { Competition } from '../app/api/competitions';
import LikeButton from './like-button';

interface CompetitionCardProps {
  competition: Competition;
  className?: string;
}

const CompetitionCard: React.FC<CompetitionCardProps> = ({ 
  competition, 
  className = '' 
}) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
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
    <Link
      href={`/competitions/${competition.id}`}
      className={`block rounded-xl shadow-lg overflow-hidden hover:shadow-xl focus:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 group cursor-pointer bg-white hover:bg-gray-50 focus:bg-gray-50 border border-gray-100 hover:border-blue-200 focus:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${className}`}
    >
      {/* Image */}
      <div className="relative h-48">
        {competition.background_image_url ? (
          <img
            src={competition.background_image_url}
            alt={competition.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{competition.title.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent group-hover:from-black/40 group-hover:via-black/20 transition-opacity duration-300"></div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2 transform group-hover:scale-110 transition-transform duration-300">
          {getStatusBadge(competition.is_active)}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
            {competition.title}
          </h3>
          <div onClick={(e) => e.preventDefault()}>
            <LikeButton competitionId={competition.id} competition={competition} />
          </div>
        </div>
        
        {competition.location && (
          <div className="flex items-center gap-2 text-gray-600 mb-3 group-hover:text-gray-700 transition-colors duration-200">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{competition.location}</span>
          </div>
        )}
        
        {competition.introduction && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 group-hover:text-gray-700 transition-colors duration-200">
            {competition.introduction}
          </p>
        )}
        
        {/* Quick Facts */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="group-hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200">
            <span className="text-gray-500">Format:</span>
            <span className="ml-1 font-medium text-gray-900">
              {getFormatDisplay(competition.format)}
            </span>
          </div>
          <div className="group-hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200">
            <span className="text-gray-500">Scale:</span>
            <span className="ml-1 font-medium text-gray-900">
              {getScaleDisplay(competition.scale)}
            </span>
          </div>
          <div className="group-hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200">
            <span className="text-gray-500">Age:</span>
            <span className="ml-1 font-medium text-gray-900">
              {formatAgeRange(competition.target_age_min, competition.target_age_max)}
            </span>
          </div>
          <div className="group-hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200">
            <span className="text-gray-500">Deadline:</span>
            <span className="ml-1 font-medium text-gray-900">
              {formatDate(competition.registration_deadline)}
            </span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
          <div className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg group-hover:bg-blue-700 transition-colors">
            View Details
          </div>
          {competition.competition_link && (
            <a
              href={competition.competition_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CompetitionCard; 