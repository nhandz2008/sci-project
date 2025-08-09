const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiError {
  detail?: string;
  error?: {
    type: string;
    message: string;
    code: string;
    details: string;
    field_errors?: Record<string, string>;
  };
}

export interface ApiRequestOptions extends RequestInit {
  requireAuth?: boolean;
}

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, code?: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { requireAuth = false, ...requestOptions } = options;
  
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add authentication header if required
  if (requireAuth) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new ApiError('Authentication required', 401, 'AUTH_001');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    headers: {
      ...headers,
      ...requestOptions.headers,
    },
    ...requestOptions,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({ detail: 'Network error' }));
      
      // Handle different error formats from the API
      if (errorData.error) {
        // Custom application error with field-specific validation errors
        if (errorData.error.type === 'validation_error' && errorData.error.field_errors) {
          throw new ApiError(
            `Validation failed: ${Object.entries(errorData.error.field_errors)
              .map(([field, message]) => `${field}: ${message}`)
              .join(', ')}`,
            response.status,
            errorData.error.code,
            errorData.error.field_errors
          );
        } else {
          // Other custom application errors
          throw new ApiError(
            errorData.error.message,
            response.status,
            errorData.error.code
          );
        }
      } else if (errorData.detail) {
        // HTTP exception
        throw new ApiError(errorData.detail, response.status);
      } else {
        throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
      }
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('API request failed:', error);
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

// Helper function to handle authentication errors
export function handleAuthError(error: ApiError): void {
  if (error.status === 401 || error.code?.startsWith('AUTH_')) {
    // Clear invalid token and redirect to login
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }
}

// Helper function to format validation errors for display
export function formatValidationErrors(fieldErrors: Record<string, string>): string {
  return Object.entries(fieldErrors)
    .map(([field, message]) => `${field}: ${message}`)
    .join(', ');
}

// Helper function to check if user has required role
export function hasRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'CREATOR': 1,
    'ADMIN': 2,
  };
  
  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= 
         roleHierarchy[requiredRole as keyof typeof roleHierarchy];
}
