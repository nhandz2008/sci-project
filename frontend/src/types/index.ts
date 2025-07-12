// User types
export interface User {
  id: number
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

// User management types
export interface UserCreate {
  email: string
  username: string
  password: string
  role?: UserRole
}

export interface UserUpdate {
  email?: string
  username?: string
  password?: string
  role?: UserRole
  is_active?: boolean
}

export interface UserProfile {
  id: number
  email: string
  username: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserListResponse {
  users: User[]
  total: number
  page: number
  size: number
  pages: number
}

// Competition types
export interface Competition {
  id: number
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
  subject_areas?: string
  is_featured: boolean
  is_active: boolean
  created_by: number
  created_at: string
  updated_at?: string
}

export interface CompetitionWithCreator extends Competition {
  creator_username: string
}

export interface CompetitionCard {
  id: number
  title: string
  location: string
  scale: CompetitionScale
  registration_deadline: string
  image_url?: string
  is_featured: boolean
}

export interface CompetitionPublic {
  id: number
  title: string
  description: string
  location: string
  scale: CompetitionScale
  start_date: string
  end_date: string
  registration_deadline: string
  image_url?: string
  external_url?: string
  is_featured: boolean
}

export enum CompetitionScale {
  LOCAL = 'local',
  REGIONAL = 'regional', 
  NATIONAL = 'national',
  INTERNATIONAL = 'international',
}

// Competition list response
export interface CompetitionListResponse {
  competitions: CompetitionPublic[]
  total: number
  page: number
  size: number
  pages: number
}

// Competition creation/update
export interface CompetitionCreate {
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
  subject_areas?: string
  is_featured?: boolean
  is_active?: boolean
}

export interface CompetitionUpdate {
  title?: string
  description?: string
  location?: string
  scale?: CompetitionScale
  start_date?: string
  end_date?: string
  registration_deadline?: string
  prize_structure?: string
  eligibility_criteria?: string
  image_url?: string
  external_url?: string
  target_age_min?: number
  target_age_max?: number
  required_grade_min?: number
  required_grade_max?: number
  subject_areas?: string
  is_featured?: boolean
  is_active?: boolean
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

export interface Token {
  access_token: string
  token_type: string
  expires_in: number
}

export interface AuthResponse {
  user: User
  token: Token
}

// Recommendation types
export interface RecommendationUserProfile {
  age?: number
  school_level?: string
  grade?: number
  gpa?: number
  interests?: string[]
}

export interface RecommendationRequest {
  user_profile: RecommendationUserProfile
  max_results?: number
}

export interface CompetitionRecommendation {
  competition: Competition
  match_score: number
  reasoning: string
}

export interface RecommendationResponse {
  recommendations: CompetitionRecommendation[]
  user_profile: RecommendationUserProfile
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

// Filter types
export interface CompetitionFilters {
  search?: string
  location?: string
  scale?: CompetitionScale
  is_featured?: boolean
  age_min?: number
  age_max?: number
  grade_min?: number
  grade_max?: number
  subject_areas?: string[]
}

// Utility types
export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
}

export interface ImageUploadResponse {
  image_url: string
} 