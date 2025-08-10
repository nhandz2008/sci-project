# Image Upload Integration

This document describes the image upload functionality that has been integrated into the SCI frontend application.

## Overview

The image upload system allows users to upload images for competitions, including:
- Background images for competitions
- Multiple detail images for competitions
- User profile images (future enhancement)

## Two-Step Upload Process

For competition creation, the system uses a two-step process to handle the competition ID requirement:

1. **Step 1**: Create the competition without images to get the competition ID
2. **Step 2**: Upload images using the competition ID, then update the competition with image URLs

This ensures that all competition-related images are properly organized with the correct competition ID.

## Components

### 1. ImageUpload Component (`components/image-upload.tsx`)

A reusable component for single image uploads with the following features:
- Drag and drop interface
- File type validation (JPEG, PNG, WebP)
- File size validation (default 10MB max)
- Preview functionality
- Error handling
- Loading states
- Support for both immediate upload and file storage

**Props:**
- `label`: Display label for the upload area
- `value`: Current image URL
- `onChange`: Callback when image URL changes
- `onFileChange`: Callback when file is selected (for delayed upload)
- `onError`: Callback for error handling
- `category`: Upload category ('user-image', 'competition-background', 'competition-asset')
- `competitionId`: Required for competition-related uploads
- `className`: Additional CSS classes
- `placeholder`: Custom placeholder text
- `accept`: Allowed file types
- `maxSize`: Maximum file size in MB
- `disabled`: Disable the upload component
- `immediateUpload`: Whether to upload immediately or store file (default: true)

### 2. DetailImagesUpload Component (`components/detail-images-upload.tsx`)

A component for handling multiple detail images with:
- Grid layout for image previews
- Add/remove functionality
- Maximum image limit (default 5)
- Individual upload progress indicators
- Support for both immediate upload and file storage

**Props:**
- `label`: Display label
- `value`: Array of image URLs
- `onChange`: Callback when URLs change
- `onFileChange`: Callback when files are selected (for delayed upload)
- `onError`: Error handling callback
- `competitionId`: Competition ID for uploads
- `className`: Additional CSS classes
- `maxImages`: Maximum number of images (default 5)
- `maxSize`: Maximum file size per image (default 10MB)
- `immediateUpload`: Whether to upload immediately or store files (default: true)

### 3. ImagePreview Component (`components/image-preview.tsx`)

A simple component for displaying images with optional click-to-view functionality.

### 4. useImageUpload Hook (`hooks/useImageUpload.ts`)

A custom React hook that provides:
- Upload state management
- Error handling
- File validation
- Upload functionality

## API Integration

### Upload API (`app/api/upload.ts`)

The upload API provides three main functions:

1. **uploadImage(file, options)**: Upload a single image
2. **deleteImage(key)**: Delete an uploaded image
3. **getUploadStatus()**: Check upload service status

### Competition API (`app/api/competitions.ts`)

The competition API includes a new method for handling image uploads:

1. **createCompetitionWithImages(data, backgroundImageFile?, detailImageFiles?)**:
   - Creates competition without images first
   - Uploads images using the competition ID
   - Updates competition with image URLs
   - Returns the complete competition object

## Usage Examples

### Single Image Upload

```tsx
import ImageUpload from '../components/image-upload';

function CompetitionForm() {
  const [backgroundImage, setBackgroundImage] = useState('');

  return (
    <ImageUpload
      label="Background Image"
      value={backgroundImage}
      onChange={setBackgroundImage}
      category="competition-background"
      competitionId={competitionId}
      onError={(error) => console.error(error)}
    />
  );
}
```

### Multiple Images Upload

```tsx
import DetailImagesUpload from '../components/detail-images-upload';

function CompetitionForm() {
  const [detailImages, setDetailImages] = useState<string[]>([]);

  return (
    <DetailImagesUpload
      label="Detail Images"
      value={detailImages}
      onChange={setDetailImages}
      competitionId={competitionId}
      maxImages={5}
      onError={(error) => console.error(error)}
    />
  );
}
```

### Using the Hook

```tsx
import { useImageUpload } from '../hooks/useImageUpload';

function MyComponent() {
  const { isUploading, uploadError, uploadImage, clearError } = useImageUpload({
    category: 'competition-background',
    competitionId: '123',
    maxSize: 10
  });

  const handleFileSelect = async (file: File) => {
    const url = await uploadImage(file);
    if (url) {
      console.log('Upload successful:', url);
    }
  };

  return (
    <div>
      {uploadError && <p className="text-red-500">{uploadError}</p>}
      {isUploading && <p>Uploading...</p>}
      <input type="file" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
    </div>
  );
}
```

## File Validation

The system validates uploaded files based on:

- **File Types**: JPEG, JPG, PNG, WebP
- **File Size**: Maximum 10MB per file (configurable)
- **Competition ID**: Required for competition-related uploads

## Error Handling

The upload system provides comprehensive error handling:

- File type validation errors
- File size validation errors
- Network errors
- Server errors
- Authentication errors

All errors are displayed to the user with clear, actionable messages.

## Security Considerations

- File type validation prevents malicious file uploads
- File size limits prevent abuse
- Authentication required for all uploads
- Competition ID validation ensures proper organization
- Server-side validation should also be implemented

## Future Enhancements

- Drag and drop functionality
- Image compression before upload
- Progress indicators for large files
- Image editing capabilities
- Bulk upload functionality
- Image optimization and resizing
