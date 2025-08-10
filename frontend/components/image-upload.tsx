'use client';

import { useState, useRef } from 'react';
import { uploadImage, deleteImage, UploadCategory } from '../app/api/upload';
import { ApiError } from '../app/api/utils';

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  onFileChange?: (file: File | null) => void; // New prop for file handling
  onError?: (error: string) => void;
  category?: UploadCategory;
  competitionId?: string;
  className?: string;
  placeholder?: string;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
  immediateUpload?: boolean; // Whether to upload immediately or store file
}

export default function ImageUpload({
  label,
  value,
  onChange,
  onFileChange,
  onError,
  category = 'user-image',
  competitionId,
  className = '',
  placeholder = 'Click to upload image',
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  maxSize = 10,
  disabled = false,
  immediateUpload = true
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Store the file
    setSelectedFile(file);
    onFileChange?.(file);

    // Upload immediately if enabled and we have the required data
    if (immediateUpload) {
      if ((category === 'competition-background' || category === 'competition-asset') && !competitionId) {
        onError?.('Competition ID is required for competition-related uploads.');
        return;
      }

      setIsUploading(true);
      try {
        const uploadResult = await uploadImage(file, {
          category,
          competitionId
        });

        onChange(uploadResult.url);
        onError?.(''); // Clear any previous errors
      } catch (error) {
        console.error('Upload failed:', error);

        // Reset preview
        setPreviewUrl(value || null);
        setSelectedFile(null);
        onFileChange?.(null);

        if (error instanceof ApiError) {
          onError?.(error.message);
        } else {
          onError?.('Upload failed. Please try again.');
        }
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!value && !selectedFile) {
      setPreviewUrl(null);
      onChange('');
      onFileChange?.(null);
      return;
    }

    // If we have a URL and immediate upload was used, we should try to delete it from the server
    // However, since we don't have the S3 key, we'll just clear the local state
    setPreviewUrl(null);
    setSelectedFile(null);
    onChange('');
    onFileChange?.(null);
  };

  const handleClick = () => {
    if (!isUploading && !disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || disabled}
        />

        <div
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-label={placeholder}
          className={`
            relative border-2 border-dashed rounded-lg p-4 text-center transition-colors duration-200 ease-in-out
            ${disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : isUploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : previewUrl
                  ? 'border-blue-300 bg-blue-50 hover:border-blue-400 cursor-pointer'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
            }
          `}
        >
          {isUploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : previewUrl ? (
            <div className="space-y-2">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-32 max-w-full mx-auto rounded object-cover"
              />
              <p className="text-sm text-gray-600">
                {immediateUpload ? 'Click to change image' : 'Image selected'}
              </p>
              {!immediateUpload && selectedFile && (
                <p className="text-xs text-gray-500">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm text-gray-600">{placeholder}</p>
              <p className="text-xs text-gray-500">
                PNG, JPG, WebP up to {maxSize}MB
              </p>
            </div>
          )}
        </div>

        {previewUrl && !isUploading && !disabled && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
            aria-label="Remove image"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {value && (
        <p className="text-xs text-gray-500">
          Current image: {value.split('/').pop()}
        </p>
      )}
    </div>
  );
}
