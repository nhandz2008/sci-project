// User types
export interface User {
  id: string
  email: string
  username: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export enum UserRole {
  ADMIN = 'admin',
  CREATOR = 'creator',
}

// Competition types
export interface Competition {
  id: string
  title: string
  description: string
  location: string
  scale: CompetitionScale
  start_date: string
  end_date: string
  registration_deadline: string
  prize_structure?: string
  eligibility_criteria?: string
  image_url?: string
  external_url?: string
  target_age_min?: number
  target_age_max?: number
  required_grade_min?: number
  required_grade_max?: number
  subject_areas?: string[]
  is_featured: boolean
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export enum CompetitionScale {
  LOCAL = 'local',
  REGIONAL = 'regional', 
  NATIONAL = 'national',
  INTERNATIONAL = 'international',
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// Auth types
export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

// Recommendation types
export interface UserProfile {
  age?: number
  school_level?: string
  grade?: number
  gpa?: number
  interests?: string[]
}

export interface RecommendationRequest {
  user_profile: UserProfile
  max_results?: number
}

export interface CompetitionRecommendation {
  competition: Competition
  match_score: number
  reasoning: string
}

export interface RecommendationResponse {
  recommendations: CompetitionRecommendation[]
  user_profile: UserProfile
  generated_at: string
}

// Form types
export interface CompetitionFormData {
  title: string
  description: string
  location: string
  scale: CompetitionScale
  start_date: string
  end_date: string
  registration_deadline: string
  prize_structure?: string
  eligibility_criteria?: string
  image_url?: string
  external_url?: string
  target_age_min?: number
  target_age_max?: number
  required_grade_min?: number
  required_grade_max?: number
  subject_areas?: string[]
  is_featured?: boolean
  is_active?: boolean
}

// Filter and search types
export interface CompetitionFilters {
  search?: string
  scale?: CompetitionScale[]
  location?: string
  start_date_after?: string
  start_date_before?: string
  is_featured?: boolean
  subject_areas?: string[]
}

export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
} 