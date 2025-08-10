import { useState } from 'react';
import { uploadImage, UploadCategory } from '../app/api/upload';
import { ApiError } from '../app/api/utils';

interface UseImageUploadOptions {
  category?: UploadCategory;
  competitionId?: string;
  maxSize?: number; // in MB
}

interface UseImageUploadReturn {
  isUploading: boolean;
  uploadError: string | null;
  uploadImage: (file: File) => Promise<string | null>;
  clearError: () => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const { category = 'user-image', competitionId, maxSize = 10 } = options;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImageFile = async (file: File): Promise<string | null> => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      const error = 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.';
      setUploadError(error);
      return null;
    }

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const error = `File size too large. Maximum size is ${maxSize}MB.`;
      setUploadError(error);
      return null;
    }

    // Validate competition ID for competition-related uploads
    if ((category === 'competition-background' || category === 'competition-asset') && !competitionId) {
      const error = 'Competition ID is required for competition-related uploads.';
      setUploadError(error);
      return null;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadImage(file, {
        category,
        competitionId
      });

      return result.url;
    } catch (error) {
      console.error('Upload failed:', error);

      let errorMessage = 'Upload failed. Please try again.';
      if (error instanceof ApiError) {
        errorMessage = error.message;
      }

      setUploadError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const clearError = () => {
    setUploadError(null);
  };

  return {
    isUploading,
    uploadError,
    uploadImage: uploadImageFile,
    clearError
  };
}
