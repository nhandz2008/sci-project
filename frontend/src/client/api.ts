import axios, { AxiosInstance, AxiosResponse } from 'axios'
import type {
  User,
  LoginCredentials,
  AuthResponse,
  APIResponse,
  UserProfile,
  RecommendationRequest,
  RecommendationResponse,
} from '@/types'

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth token management
const TOKEN_KEY = 'sci_auth_token'

export const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY)
  },
  
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token)
  },
  
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY)
  },
  
  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const exp = payload.exp * 1000 // Convert to milliseconds
      return Date.now() >= exp
    } catch {
      return true
    }
  },
}

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = tokenManager.getToken()
    if (token && !tokenManager.isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 unauthorized responses
    if (error.response?.status === 401) {
      tokenManager.removeToken()
      // Could trigger a logout event here
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const authAPI = {
  /**
   * Login user with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const formData = new FormData()
    formData.append('username', credentials.email) // OAuth2 uses 'username' field
    formData.append('password', credentials.password)
    
    const response: AxiosResponse<AuthResponse> = await api.post(
      '/auth/login',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
    
    // Store token after successful login
    if (response.data.token?.access_token) {
      tokenManager.setToken(response.data.token.access_token)
    }
    
    return response.data
  },

  /**
   * Get current user information
   */
  getCurrentUser: async (): Promise<User> => {
    const response: AxiosResponse<User> = await api.get('/auth/me')
    return response.data
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout')
    } finally {
      // Always remove token, even if API call fails
      tokenManager.removeToken()
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const token = tokenManager.getToken()
    return token !== null && !tokenManager.isTokenExpired(token)
  },
}

export const healthAPI = {
  /**
   * Check API health status
   */
  checkHealth: async (): Promise<any> => {
    const response = await api.get('/health')
    return response.data
  },
}

// Export the configured axios instance for other API calls
export default api 