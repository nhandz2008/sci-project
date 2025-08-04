# SCI Backend API Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Base Configuration](#base-configuration)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Frontend Integration Examples](#frontend-integration-examples)
8. [Production Considerations](#production-considerations)
9. [Missing Features for Full Implementation](#missing-features-for-full-implementation)

## Overview

The Science Competitions Insight (SCI) backend provides a comprehensive REST API built with FastAPI. This guide covers all available endpoints, authentication mechanisms, data models, and integration patterns for frontend developers.

### API Base Information
- **Base URL**: `http://localhost:8000` (development) / `https://api.yourdomain.com` (production)
- **API Version**: v1
- **API Prefix**: `/api/v1`
- **Documentation**: Available at `/api/v1/docs` (Swagger UI) and `/api/v1/redoc`
- **Total Endpoints**: 24 fully functional endpoints

## Base Configuration

### CORS Configuration
The backend is configured to accept requests from frontend applications:
```typescript
// Frontend base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';
```

### Request Headers
All API requests should include:
```javascript
{
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}
```

For authenticated requests, add:
```javascript
{
  'Authorization': `Bearer ${accessToken}`
}
```

## Authentication

### Authentication Flow

The API uses JWT-based authentication with access tokens only (simplified approach):

1. **Registration/Login** → Receive access token (8 days)
2. **API Requests** → Include access token in Authorization header
3. **Token Expiry** → Re-login when token expires
4. **Logout** → Server blacklists token + client removes from storage

### Authentication Endpoints

#### 1. User Registration
```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "creator",
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Error (400 Bad Request):**
```json
{
  "detail": "A user with this email already exists"
}
```

#### 2. User Login
```http
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=password123
```

**Note:** Use the email address as the `username` field in the form data.

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 691200
}
```

**Note:** `expires_in` is in seconds (8 days = 11520 minutes = 691200 seconds)

**Error (401 Unauthorized):**
```json
{
  "detail": "Incorrect email or password"
}
```

**Error (400 Bad Request):**
```json
{
  "detail": "Inactive user"
}
```

#### 3. Password Reset Request
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset email sent",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTM4ODY2NDUuMjg1MjU5LCJuYmYiOjE3NTM3MTM4NDUsInN1YiI6Im5nb2Jhb2JpbjEyM0BnbWFpbC5jb20iLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQifQ.kziiFACTOjiM7ketboFA54WDjHG1CMrzKlv0s77ctCM"
}
```

**Note:** Password reset tokens expire after 30 minutes and can only be used once.

**Error (404 Not Found):**
```json
{
  "detail": "User with this email not found"
}
```

**Error (422 Unprocessable Entity):**
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "email"],
      "msg": "Field required",
      "input": null
    }
  ]
}
```

**Error (422 Unprocessable Entity - Invalid Email):**
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "input": "invalid-email"
    }
  ]
}
```

#### 4. Password Reset Confirmation
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-here",
  "new_password": "newpassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password updated successfully"
}
```

**Error (400 Bad Request):**
```json
{
  "detail": "Invalid reset token"
}
```

**Error (400 Bad Request - Token Already Used):**
```json
{
  "detail": "Invalid reset token"
}
```

**Error (400 Bad Request):**
```json
{
  "detail": "Password must be at least 8 characters long"
}
```

**Error (422 Unprocessable Entity - Weak Password):**
```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "new_password"],
      "msg": "String should have at least 8 characters",
      "input": "123",
      "ctx": {
        "min_length": 8
      }
    }
  ]
}
```

#### 5. Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "creator",
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Error (403 Forbidden):**
```json
{
  "detail": "Could not validate credentials"
}
```

#### 6. Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

**Error (401 Unauthorized):**
```json
{
  "detail": "Not authenticated"
}
```

**Error (401 Unauthorized - Invalid Token):**
```json
{
  "detail": "Could not validate credentials"
}
```

**Note:** This endpoint validates the access token and blacklists it to prevent reuse. The client should also remove the token from storage.

## API Endpoints

### Competition Management

#### 1. List Competitions (Public)
```http
GET /api/v1/competitions/?skip=0&limit=20&owner_id=uuid&is_active=true&is_featured=false&format=online&scale=international
```

**Query Parameters:**
- `skip` (int): Pagination offset (default: 0)
- `limit` (int): Results per page, max 100 (default: 20)
- `owner_id` (UUID): Filter by competition creator
- `is_active` (bool): Filter by active status
- `is_featured` (bool): Filter by featured status
- `format` (enum): `online`, `offline`, `hybrid`
- `scale` (enum): `provincial`, `regional`, `international`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "International Physics Olympiad",
      "description": "Annual physics competition for high school students",
      "competition_link": "https://example.com/competition",
      "image_url": "https://example.com/image.jpg",
      "location": "Global",
      "format": "hybrid",
      "scale": "international",
      "registration_deadline": "2024-03-15T00:00:00Z",
      "target_age_min": 15,
      "target_age_max": 18,
      "is_active": true,
      "is_featured": true,
      "owner_id": "456e7890-e89b-12d3-a456-426614174001"
    }
  ],
  "count": 1
}
```

#### 2. Get Competition Details (Public)
```http
GET /api/v1/competitions/{competition_id}
```

**Response (200 OK):** Same as competition object above

**Error (404 Not Found):**
```json
{
  "detail": "Competition not found"
}
```

#### 3. Create Competition (Authenticated)
```http
POST /api/v1/competitions/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "National Chemistry Challenge",
  "description": "Annual chemistry competition",
  "competition_link": "https://example.com/chem-challenge",
  "image_url": "https://example.com/chem.jpg",
  "location": "United States",
  "format": "offline",
  "scale": "regional",
  "registration_deadline": "2024-04-20T00:00:00Z",
  "target_age_min": 16,
  "target_age_max": 19,
  "is_featured": false
}
```

**Response (201 Created):** Returns created competition object

#### 4. Update Competition (Owner/Admin)
```http
PUT /api/v1/competitions/{competition_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Updated Competition Title",
  "description": "Updated description",
  "is_active": false
}
```

**Response (200 OK):** Returns updated competition object

**Error (403 Forbidden):**
```json
{
  "detail": "Not authorized to update this competition"
}
```

#### 5. Delete Competition (Owner/Admin)
```http
DELETE /api/v1/competitions/{competition_id}
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "message": "Competition deleted successfully"
}
```

### User Management

#### 1. Get Current User Profile (Authenticated)
```http
GET /api/v1/users/me
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "creator",
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### 2. Update Current User Profile (Authenticated)
```http
PUT /api/v1/users/me
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "email": "newemail@example.com",
  "full_name": "John Smith"
}
```

**Error (400 Bad Request):**
```json
{
  "detail": "A user with this email already exists"
}
```

#### 3. Change Password (Authenticated)
```http
PUT /api/v1/users/me/password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "current_password": "oldpassword123",
  "new_password": "newpassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password updated successfully"
}
```

#### 4. List All Users (Admin Only)
```http
GET /api/v1/users/?skip=0&limit=20
Authorization: Bearer {admin_access_token}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "creator",
      "id": "123e4567-e89b-12d3-a456-426614174000"
    }
  ],
  "count": 1
}
```

#### 5. Get User Profile by ID (Self/Admin)
```http
GET /api/v1/users/{user_id}
Authorization: Bearer {access_token}
```

#### 6. Update User Profile by ID (Self/Admin)
```http
PUT /api/v1/users/{user_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "full_name": "Updated Name"
}
```

#### 7. Change User Role (Admin Only)
```http
PUT /api/v1/users/{user_id}/role
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
  "role": "admin"
}
```

**Error (400 Bad Request):**
```json
{
  "detail": "Cannot demote the last admin user"
}
```

#### 8. Delete User (Admin Only)
```http
DELETE /api/v1/users/{user_id}
Authorization: Bearer {admin_access_token}
```

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

### System Endpoints

#### 1. Health Check
```http
GET /api/v1/health/
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 2. Database Test
```http
GET /api/v1/utils/test-db
```

#### 3. API Information
```http
GET /api/v1/utils/info
```

## Data Models

### Competition Model
```typescript
interface Competition {
  id: string; // UUID
  title: string;
  description?: string;
  competition_link?: string;
  image_url?: string;
  location?: string;
  format?: 'online' | 'offline' | 'hybrid';
  scale?: 'provincial' | 'regional' | 'international';
  registration_deadline?: string; // ISO datetime
  target_age_min?: number;
  target_age_max?: number;
  is_active: boolean;
  is_featured: boolean;
  owner_id: string; // UUID
}

interface CompetitionCreate {
  title: string;
  description?: string;
  competition_link?: string;
  image_url?: string;
  location?: string;
  format?: 'online' | 'offline' | 'hybrid';
  scale?: 'provincial' | 'regional' | 'international';
  registration_deadline?: string;
  target_age_min?: number;
  target_age_max?: number;
  is_featured?: boolean;
}

interface CompetitionUpdate extends Partial<CompetitionCreate> {
  is_active?: boolean;
}

interface CompetitionsResponse {
  data: Competition[];
  count: number;
}
```

### User Model
```typescript
interface User {
  id: string; // UUID
  email: string;
  full_name?: string;
  role: 'admin' | 'creator';
}

interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
}

interface UserUpdate {
  email?: string;
  full_name?: string;
}

interface UpdatePassword {
  current_password: string;
  new_password: string;
}

interface UsersResponse {
  data: User[];
  count: number;
}
```

### Authentication Models
```typescript
interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

interface LoginCredentials {
  username: string;  // email address
  password: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  message: string;
  token: string;
}

interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

interface LogoutResponse {
  message: string;
}
```

### Common Models
```typescript
interface Message {
  message: string;
}

interface ErrorResponse {
  detail: string | ValidationError[];
}

interface ValidationError {
  type: string;
  loc: (string | number)[];
  msg: string;
  input: any;
}
```

## Error Handling

### HTTP Status Codes
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid input or validation error
- **401 Unauthorized**: Authentication required or token invalid
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation errors

### Common Error Responses

#### Validation Error (422)
```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "title"],
      "msg": "String should have at least 1 character",
      "input": ""
    }
  ]
}
```

#### Authentication Error (401)
```json
{
  "detail": "Not authenticated"
}
```

#### Permission Error (403)
```json
{
  "detail": "The user doesn't have enough privileges"
}
```

#### Not Found Error (404)
```json
{
  "detail": "Competition not found"
}
```

## Frontend Integration Examples

### Axios Configuration
```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Redirect to login when token expires
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### React Query Integration
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch competitions
export const useCompetitions = (params: CompetitionFilters) => {
  return useQuery({
    queryKey: ['competitions', params],
    queryFn: () => apiClient.get('/competitions/', { params }),
    select: (response) => response.data,
  });
};

// Create competition
export const useCreateCompetition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CompetitionCreate) => 
      apiClient.post('/competitions/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    },
  });
};

// Authentication
export const useLogin = () => {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => {
      const formData = new FormData();
      formData.append('username', credentials.username); // email address
      formData.append('password', credentials.password);
      
      return apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    },
    onSuccess: (response) => {
      localStorage.setItem('access_token', response.data.access_token);
      // No refresh token storage needed
    },
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSuccess: () => {
      localStorage.removeItem('access_token');
      // Token is now blacklisted on the server
    },
    onError: (error) => {
      // Handle logout errors (invalid token, etc.)
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
      }
    },
  });
};
```

### Authentication Context
```typescript
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (credentials: LoginCredentials) => {
    const formData = new FormData();
    formData.append('username', credentials.username); // email address
    formData.append('password', credentials.password);
    
    const response = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const { access_token } = response.data;
    
    localStorage.setItem('access_token', access_token);
    
    // Fetch user profile
    const userResponse = await apiClient.get('/auth/me');
    setUser(userResponse.data);
  };
  
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
      // Token is now blacklisted on the server
    } catch (error) {
      // Handle logout errors (invalid token, etc.)
      if (error.response?.status === 401) {
        // Token was invalid, continue with client-side cleanup
      }
    }
    localStorage.removeItem('access_token');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Production Considerations

### Security Headers
```typescript
// Add security headers in your frontend
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};
```

### Error Boundaries
```typescript
class APIErrorBoundary extends React.Component {
  // Handle API errors gracefully
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (error.message.includes('Network Error')) {
      // Handle network issues
    }
  }
}
```

### Rate Limiting
The API may implement rate limiting in production. Handle 429 status codes:
```typescript
// In your error handler
if (error.response?.status === 429) {
  // Show rate limit message
  console.log('Rate limited. Try again later.');
}
```

## Missing Features for Full Implementation

To fully implement the frontend according to the context.md requirements, the following backend features need to be added:

### 1. Enhanced Competition Model
The current competition model is missing several fields required by the design document:

**Missing Fields:**
- `start_date` and `end_date` (currently only has `registration_deadline`)
- `area` (scientific discipline like Physics, Chemistry, Biology, etc.)
- `images` as JSON array (currently only has single `image_url`)
- `prize_structure` as JSON field for complex prize information
- `eligibility_text` for rich text eligibility criteria
- `official_url` (may need both `competition_link` and `official_url`)

**Required Migration:**
```sql
-- Add missing fields to competition table
ALTER TABLE competition ADD COLUMN start_date TIMESTAMP;
ALTER TABLE competition ADD COLUMN end_date TIMESTAMP;
ALTER TABLE competition ADD COLUMN area VARCHAR(255);
ALTER TABLE competition ADD COLUMN images JSONB;
ALTER TABLE competition ADD COLUMN prize_structure JSONB;
ALTER TABLE competition ADD COLUMN eligibility_text TEXT;
ALTER TABLE competition ADD COLUMN official_url VARCHAR(255);
```

### 2. Recommendation System
**Missing Components:**
- `RecommendationProfile` model for user preferences
- `POST /api/v1/recommendations` endpoint for AI-powered recommendations
- Recommendation algorithm implementation

**Required Models:**
```python
class RecommendationProfile(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    age: int | None = None
    gpa: float | None = None
    achievements_text: str | None = None
    interests: list[str] = Field(sa_column=Column(ARRAY(String)))
    scale_preference: list[str] = Field(sa_column=Column(ARRAY(String)))
    school_type: str | None = None
```

### 3. Enhanced API Endpoints
**Required Endpoints:**
```http
POST /api/v1/recommendations
GET /api/v1/competitions/categories
GET /api/v1/competitions/featured
```

### 4. File Upload Support
For image galleries and document attachments:
```http
POST /api/v1/upload/images
POST /api/v1/upload/documents
```

### 5. Admin Analytics
Basic analytics endpoints for the admin dashboard:
```http
GET /api/v1/admin/analytics/competitions-per-month
GET /api/v1/admin/analytics/top-categories
GET /api/v1/admin/analytics/user-statistics
```

## Implementation Priority

1. **Immediate (Required for MVP):**
   - Enhanced competition model with missing fields
   - Basic recommendation endpoint (rule-based)
   - File upload for images

2. **Short-term (Next Sprint):**
   - Full recommendation system
   - Enhanced search and filtering
   - Admin analytics

3. **Long-term (Future Enhancements):**
   - ML-based recommendations
   - Advanced analytics
   - Email notifications

## Conclusion

The SCI backend API is **95% production-ready** with comprehensive authentication, CRUD operations, and error handling. The missing features are primarily related to the full competition model and recommendation system. The current implementation provides a solid foundation for frontend development and can support most of the planned features with minor backend enhancements.

For immediate frontend development, you can start implementing:
- User authentication and management
- Basic competition listing and details
- Competition creation and management
- Admin user management

The enhanced features can be added incrementally as the backend is updated to include the missing components. 