import axios, { AxiosInstance, AxiosResponse } from 'axios'
import type {
  User,
  LoginCredentials,
  AuthResponse,
  APIResponse,
  UserProfile,
  UserCreate,
  UserUpdate,
  UserListResponse,
  RecommendationRequest,
  RecommendationResponse,
  Competition,
  CompetitionWithCreator,
  CompetitionCard,
  CompetitionPublic,
  CompetitionListResponse,
  CompetitionCreate,
  CompetitionUpdate,
  CompetitionFilters,
  CompetitionScale,
  ImageUploadResponse,
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

export const competitionAPI = {
  /**
   * Get all competitions with optional filtering and pagination
   */
  getCompetitions: async (params?: {
    skip?: number
    limit?: number
    search?: string
    location?: string
    scale?: CompetitionScale
    is_featured?: boolean
    age_min?: number
    age_max?: number
    grade_min?: number
    grade_max?: number
    subject_areas?: string[]
  }): Promise<CompetitionListResponse> => {
    const searchParams = new URLSearchParams()
    
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString())
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.location) searchParams.append('location', params.location)
    if (params?.scale) searchParams.append('scale', params.scale)
    if (params?.is_featured !== undefined) searchParams.append('is_featured', params.is_featured.toString())
    if (params?.age_min !== undefined) searchParams.append('age_min', params.age_min.toString())
    if (params?.age_max !== undefined) searchParams.append('age_max', params.age_max.toString())
    if (params?.grade_min !== undefined) searchParams.append('grade_min', params.grade_min.toString())
    if (params?.grade_max !== undefined) searchParams.append('grade_max', params.grade_max.toString())
    if (params?.subject_areas) {
      params.subject_areas.forEach(area => searchParams.append('subject_areas', area))
    }
    
    const response: AxiosResponse<CompetitionListResponse> = await api.get(
      `/competitions/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    )
    return response.data
  },

  /**
   * Get featured competitions for carousel
   */
  getFeaturedCompetitions: async (limit?: number): Promise<CompetitionCard[]> => {
    const params = limit ? `?limit=${limit}` : ''
    const response: AxiosResponse<CompetitionCard[]> = await api.get(`/competitions/featured${params}`)
    return response.data
  },

  /**
   * Get upcoming competitions (registration still open)
   */
  getUpcomingCompetitions: async (limit?: number): Promise<CompetitionCard[]> => {
    const params = limit ? `?limit=${limit}` : ''
    const response: AxiosResponse<CompetitionCard[]> = await api.get(`/competitions/upcoming${params}`)
    return response.data
  },

  /**
   * Search competitions by query
   */
  searchCompetitions: async (query: string, limit?: number): Promise<CompetitionPublic[]> => {
    const params = new URLSearchParams({ q: query })
    if (limit) params.append('limit', limit.toString())
    
    const response: AxiosResponse<CompetitionPublic[]> = await api.get(
      `/competitions/search?${params.toString()}`
    )
    return response.data
  },

  /**
   * Get competitions by scale
   */
  getCompetitionsByScale: async (scale: CompetitionScale, limit?: number): Promise<CompetitionCard[]> => {
    const params = limit ? `?limit=${limit}` : ''
    const response: AxiosResponse<CompetitionCard[]> = await api.get(
      `/competitions/scale/${scale}${params}`
    )
    return response.data
  },

  /**
   * Get current user's competitions
   */
  getMyCompetitions: async (skip?: number, limit?: number): Promise<CompetitionListResponse> => {
    const params = new URLSearchParams()
    if (skip !== undefined) params.append('skip', skip.toString())
    if (limit !== undefined) params.append('limit', limit.toString())
    
    const response: AxiosResponse<CompetitionListResponse> = await api.get(
      `/competitions/my${params.toString() ? `?${params.toString()}` : ''}`
    )
    return response.data
  },

  /**
   * Get single competition by ID
   */
  getCompetition: async (id: number): Promise<CompetitionWithCreator> => {
    const response: AxiosResponse<CompetitionWithCreator> = await api.get(`/competitions/${id}`)
    return response.data
  },

  /**
   * Create new competition
   */
  createCompetition: async (competitionData: CompetitionCreate): Promise<Competition> => {
    const response: AxiosResponse<Competition> = await api.post('/competitions/', competitionData)
    return response.data
  },

  /**
   * Update competition
   */
  updateCompetition: async (id: number, competitionData: CompetitionUpdate): Promise<Competition> => {
    const response: AxiosResponse<Competition> = await api.put(`/competitions/${id}`, competitionData)
    return response.data
  },

  /**
   * Delete competition
   */
  deleteCompetition: async (id: number): Promise<void> => {
    await api.delete(`/competitions/${id}`)
  },

  /**
   * Upload competition image
   */
  uploadCompetitionImage: async (id: number, file: File): Promise<ImageUploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response: AxiosResponse<ImageUploadResponse> = await api.post(
      `/competitions/${id}/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * Get all competitions (admin only)
   */
  getAllCompetitionsAdmin: async (
    skip?: number,
    limit?: number,
    includeInactive?: boolean
  ): Promise<CompetitionListResponse> => {
    const params = new URLSearchParams()
    if (skip !== undefined) params.append('skip', skip.toString())
    if (limit !== undefined) params.append('limit', limit.toString())
    if (includeInactive !== undefined) params.append('include_inactive', includeInactive.toString())
    
    const response: AxiosResponse<CompetitionListResponse> = await api.get(
      `/competitions/admin/all${params.toString() ? `?${params.toString()}` : ''}`
    )
    return response.data
  },

  /**
   * Admin update competition
   */
  adminUpdateCompetition: async (id: number, competitionData: CompetitionUpdate): Promise<Competition> => {
    const response: AxiosResponse<Competition> = await api.put(
      `/competitions/${id}/admin`,
      competitionData
    )
    return response.data
  },
}

export const userAPI = {
  /**
   * Register a new user
   */
  register: async (userData: UserCreate): Promise<User> => {
    const response: AxiosResponse<User> = await api.post('/users/register', userData)
    return response.data
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    const response: AxiosResponse<UserProfile> = await api.get('/users/me')
    return response.data
  },

  /**
   * Update current user profile
   */
  updateProfile: async (userData: UserUpdate): Promise<UserProfile> => {
    const response: AxiosResponse<UserProfile> = await api.put('/users/me', userData)
    return response.data
  },

  /**
   * Get all users (admin only)
   */
  getAllUsers: async (params?: {
    skip?: number
    limit?: number
    search?: string
    role?: string
    is_active?: boolean
  }): Promise<UserListResponse> => {
    const searchParams = new URLSearchParams()
    
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString())
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.role) searchParams.append('role', params.role)
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString())
    
    const response: AxiosResponse<UserListResponse> = await api.get(
      `/users/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    )
    return response.data
  },

  /**
   * Get user by ID
   */
  getUser: async (id: number): Promise<User> => {
    const response: AxiosResponse<User> = await api.get(`/users/${id}`)
    return response.data
  },

  /**
   * Update user (admin only)
   */
  updateUser: async (id: number, userData: UserUpdate): Promise<User> => {
    const response: AxiosResponse<User> = await api.put(`/users/${id}`, userData)
    return response.data
  },

  /**
   * Delete user (admin only)
   */
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`)
  },

  /**
   * Deactivate user (admin only)
   */
  deactivateUser: async (id: number): Promise<User> => {
    const response: AxiosResponse<User> = await api.put(`/users/${id}/deactivate`)
    return response.data
  },

  /**
   * Activate user (admin only)
   */
  activateUser: async (id: number): Promise<User> => {
    const response: AxiosResponse<User> = await api.put(`/users/${id}/activate`)
    return response.data
  },

  /**
   * Get user statistics (admin only)
   */
  getUserStatistics: async (): Promise<{
    total_users: number
    active_users: number
    inactive_users: number
    admin_count: number
    creator_count: number
  }> => {
    const response: AxiosResponse<{
      total_users: number
      active_users: number
      inactive_users: number
      admin_count: number
      creator_count: number
    }> = await api.get('/users/statistics')
    return response.data
  },

  /**
   * Create user (admin only)
   */
  createUser: async (userData: UserCreate): Promise<User> => {
    const response: AxiosResponse<User> = await api.post('/users/', userData)
    return response.data
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