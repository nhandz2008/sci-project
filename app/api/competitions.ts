const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Competition {
  id: string;
  title: string;
  introduction?: string;
  question_type?: string;
  selection_process?: string;
  history?: string;
  scoring_and_format?: string;
  awards?: string;
  penalties_and_bans?: string;
  notable_achievements?: string;
  competition_link?: string;
  background_image_url?: string;
  detail_image_urls?: string[];
  location?: string;
  format?: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  scale?: 'PROVINCIAL' | 'REGIONAL' | 'INTERNATIONAL';
  registration_deadline?: string;
  size?: number;
  target_age_min?: number;
  target_age_max?: number;
  is_active: boolean;
  is_featured: boolean;
  is_approved: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitionCreate {
  title: string;
  introduction?: string;
  question_type?: string;
  selection_process?: string;
  history?: string;
  scoring_and_format?: string;
  awards?: string;
  penalties_and_bans?: string;
  notable_achievements?: string;
  competition_link?: string;
  background_image_url?: string;
  detail_image_urls?: string[];
  location?: string;
  format?: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  scale?: 'PROVINCIAL' | 'REGIONAL' | 'INTERNATIONAL';
  registration_deadline?: string;
  size?: number;
  target_age_min?: number;
  target_age_max?: number;
  is_featured?: boolean;
}

export interface CompetitionUpdate extends Partial<CompetitionCreate> {
  is_active?: boolean;
}

export interface CompetitionsResponse {
  competitions: Competition[];
  total: number;
  skip: number;
  limit: number;
}

export interface CompetitionFilters {
  skip?: number;
  limit?: number;
  format?: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  scale?: 'PROVINCIAL' | 'REGIONAL' | 'INTERNATIONAL';
  location?: string;
  search?: string;
  sort_by?: 'created_at' | 'registration_deadline' | 'title';
  order?: 'asc' | 'desc';
}

export interface ValidationError {
  type: string;
  loc: (string | number)[];
  msg: string;
  input: any;
}

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

class CompetitionsAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({ detail: 'Network error' }));
        
        // Handle different error formats from the API
        if (errorData.error) {
          // Custom application error
          throw new Error(errorData.error.message);
        } else if (errorData.detail) {
          // HTTP exception
          throw new Error(errorData.detail);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getCompetitions(filters: CompetitionFilters = {}): Promise<CompetitionsResponse> {
    const params = new URLSearchParams();
    
    if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
    if (filters.format) params.append('format', filters.format);
    if (filters.scale) params.append('scale', filters.scale);
    if (filters.location) params.append('location', filters.location);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.order) params.append('order', filters.order);

    const queryString = params.toString();
    const endpoint = `/api/v1/competitions${queryString ? `?${queryString}` : ''}`;
    
    return this.request<CompetitionsResponse>(endpoint);
  }

  async getCompetition(id: string): Promise<Competition> {
    return this.request<Competition>(`/api/v1/competitions/${id}`);
  }

  async createCompetition(data: CompetitionCreate, token: string): Promise<Competition> {
    return this.request<Competition>('/api/v1/competitions', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async updateCompetition(id: string, data: CompetitionUpdate, token: string): Promise<Competition> {
    return this.request<Competition>(`/api/v1/competitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async deleteCompetition(id: string, token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/competitions/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const competitionsAPI = new CompetitionsAPI(); 