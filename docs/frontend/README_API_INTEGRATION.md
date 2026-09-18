# API Integration for Competitions Page

## Overview

The competitions page has been successfully integrated with the backend API running at `localhost:8000`. The integration replaces the hardcoded dummy data with real data from the backend.

## Changes Made

### 1. API Service Layer (`frontend/app/api/competitions.ts`)

Created a comprehensive API service that handles:
- Fetching competitions with filtering
- Getting individual competition details
- Creating, updating, and deleting competitions (for authenticated users)
- Proper error handling and TypeScript types

### 2. Custom Hook (`frontend/app/hooks/useCompetitions.ts`)

Created a React hook that provides:
- Loading states
- Error handling
- Data fetching from the API
- Filter management
- Automatic refetching capabilities

### 3. Updated Competitions Page (`frontend/app/competitions/page.tsx`)

Key improvements:
- **Real-time data**: Now fetches competitions from the backend API
- **Loading states**: Shows skeleton loading while fetching data
- **Error handling**: Displays user-friendly error messages
- **Dynamic filtering**: Filter options are generated from actual data
- **Fallback images**: Handles missing images gracefully
- **Responsive design**: Maintains the existing beautiful UI

## API Endpoints Used

- `GET /api/v1/competitions/` - Fetch all competitions with optional filters
- `GET /api/v1/competitions/{id}` - Get individual competition details

## Data Mapping

The frontend maps backend competition data to the display format:

```typescript
// Backend format
{
  id: string;
  title: string;
  description?: string;
  competition_link?: string;
  image_url?: string;
  location?: string;
  format?: 'online' | 'offline' | 'hybrid';
  scale?: 'provincial' | 'regional' | 'international';
  // ... other fields
}

// Frontend display format
{
  id: string;
  name: string; // mapped from title
  overview: string; // mapped from description
  scale: string; // capitalized from backend scale
  location: string;
  modes: string[]; // mapped from format
  homepage: string; // mapped from competition_link
  image: string; // mapped from image_url with fallbacks
}
```

## Features

### ✅ Implemented
- Real-time data fetching from backend
- Loading states with skeleton UI
- Error handling with retry functionality
- Dynamic filter options based on actual data
- Search functionality
- Responsive design maintained
- Fallback images for missing competition images
- TypeScript type safety

### 🔄 Dynamic Filters
- **Scale**: International, Regional, Provincial (from backend data)
- **Mode**: Online, Offline, Hybrid (from backend data)
- **Location**: All unique locations from competitions
- **Search**: Searches through competition names and descriptions

### 🎨 UI Enhancements
- Loading skeleton with smooth animations
- Error state with retry button
- Maintained hover effects and transitions
- Proper image fallbacks
- Responsive grid layout

## Backend Requirements

The integration works with the existing backend API that provides:
- Competition data with all required fields
- Proper CORS configuration
- JSON response format
- Error handling

## Image Configuration

The frontend is configured to handle images from external sources:
- **S3 Images**: Configured to load from `sci-demoo.s3.us-east-1.amazonaws.com`
- **Local Images**: Configured for local development images
- **Fallback Images**: Graceful fallbacks for missing or invalid images

### Next.js Image Configuration
The `next.config.js` file includes proper image domain configuration:
```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'sci-demoo.s3.us-east-1.amazonaws.com',
      port: '',
      pathname: '/competition_images/**',
    },
    // Local development images
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '',
      pathname: '/**',
    },
  ],
}
```

## Testing

To test the integration:

1. **Start the backend** (if not already running):
   ```bash
   cd backend
   docker-compose up -d
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Visit the competitions page**:
   - Navigate to `http://localhost:3000/competitions`
   - You should see real competition data from the backend
   - Test the search and filter functionality
   - Verify loading states and error handling

## Error Handling

The integration includes comprehensive error handling:
- Network errors
- API errors
- Invalid data
- Missing images
- Loading timeouts

Users will see appropriate error messages and can retry failed requests.

## Performance Optimizations

- **Memoized filtering**: Uses `useMemo` for efficient filtering
- **Lazy loading**: Images load as needed
- **Debounced search**: Prevents excessive API calls
- **Caching**: Data is cached in React state
- **Optimistic updates**: UI updates immediately while API calls happen

## Future Enhancements

Potential improvements for the future:
- Pagination for large datasets
- Advanced filtering (date ranges, categories)
- Real-time updates
- Offline support
- Image optimization
- Search suggestions
- Favorites/bookmarks functionality
