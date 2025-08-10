'use client';

import { useState, useRef } from 'react';
import { uploadImage, UploadCategory } from '../app/api/upload';
import { ApiError } from '../app/api/utils';

interface DetailImagesUploadProps {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  onFileChange?: (files: File[]) => void; // New prop for file handling
  onError?: (error: string) => void;
  competitionId?: string;
  className?: string;
  maxImages?: number;
  maxSize?: number; // in MB
  immediateUpload?: boolean; // Whether to upload immediately or store files
}

export default function DetailImagesUpload({
  label,
  value = [],
  onChange,
  onFileChange,
  onError,
  competitionId,
  className = '',
  maxImages = 5,
  maxSize = 10,
  immediateUpload = true
}: DetailImagesUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check if we've reached the maximum number of images
    const totalImages = value.length + selectedFiles.length + files.length;
    if (totalImages > maxImages) {
      onError?.(`Maximum ${maxImages} images allowed.`);
      return;
    }

    // Validate each file
    for (const file of files) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        onError?.('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
        return;
      }

      // Validate file size
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        onError?.(`File size too large. Maximum size is ${maxSize}MB.`);
        return;
      }
    }

    // Store the files
    const newSelectedFiles = [...selectedFiles, ...files];
    setSelectedFiles(newSelectedFiles);
    onFileChange?.(newSelectedFiles);

    // Upload immediately if enabled and we have the required data
    if (immediateUpload) {
      if (!competitionId) {
        onError?.('Competition ID is required for competition-related uploads.');
        return;
      }

      setIsUploading(true);
      setUploadingIndex(value.length + selectedFiles.length);

      try {
        const uploadPromises = files.map(file =>
          uploadImage(file, {
            category: 'competition-asset',
            competitionId
          })
        );

        const uploadResults = await Promise.all(uploadPromises);
        const newUrls = uploadResults.map(result => result.url);
        const allUrls = [...value, ...newUrls];
        onChange(allUrls);
        onError?.(''); // Clear any previous errors
      } catch (error) {
        console.error('Upload failed:', error);

        if (error instanceof ApiError) {
          onError?.(error.message);
        } else {
          onError?.('Upload failed. Please try again.');
        }
      } finally {
        setIsUploading(false);
        setUploadingIndex(null);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const handleRemoveSelectedFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFileChange?.(newFiles);
  };

  const handleClick = () => {
    if (!isUploading && (value.length + selectedFiles.length) < maxImages) {
      fileInputRef.current?.click();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const totalImages = value.length + selectedFiles.length;

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        multiple
        className="hidden"
        disabled={isUploading}
      />

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Existing uploaded images */}
        {value.map((url, index) => (
          <div key={`uploaded-${index}`} className="relative group">
            <img
              src={url}
              alt={`Detail image ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
              aria-label={`Remove image ${index + 1}`}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {/* Selected files (not yet uploaded) */}
        {selectedFiles.map((file, index) => (
          <div key={`selected-${index}`} className="relative group">
            <div className="w-full h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                </svg>
                <p className="text-xs text-gray-600 truncate px-2">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveSelectedFile(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
              aria-label={`Remove selected file ${index + 1}`}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {/* Upload Button */}
        {totalImages < maxImages && (
          <div
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label="Add detail image"
            className={`
              w-full h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer
              transition-colors duration-200 ease-in-out
              ${isUploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            {isUploading && uploadingIndex !== null ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-1"></div>
                <p className="text-xs text-gray-600">Uploading...</p>
              </div>
            ) : (
              <div className="text-center">
                <svg
                  className="mx-auto h-6 w-6 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <p className="text-xs text-gray-600 mt-1">Add Image</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-500">
        {totalImages} of {maxImages} images {immediateUpload ? 'uploaded' : 'selected'}. PNG, JPG, WebP up to {maxSize}MB each.
      </p>
    </div>
  );
}
