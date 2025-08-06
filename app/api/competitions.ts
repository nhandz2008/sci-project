const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Competition {
  id: string;
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
  is_active: boolean;
  is_featured: boolean;
  owner_id: string;
}

export interface CompetitionCreate {
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

export interface CompetitionUpdate extends Partial<CompetitionCreate> {
  is_active?: boolean;
}

export interface CompetitionsResponse {
  data: Competition[];
  count: number;
}

export interface CompetitionFilters {
  skip?: number;
  limit?: number;
  owner_id?: string;
  is_active?: boolean;
  is_featured?: boolean;
  format?: 'online' | 'offline' | 'hybrid';
  scale?: 'provincial' | 'regional' | 'international';
}

export interface ValidationError {
  type: string;
  loc: (string | number)[];
  msg: string;
  input: any;
}

export interface ApiError {
  detail: string | ValidationError[];
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
    console.log('Making API request to:', url);
    console.log('Request options:', { method: options.method, headers: options.headers, body: options.body });
    
    const config: RequestInit = {
      headers: {
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
        if (!response.ok) {
          const errorData: ApiError = await response.json().catch(() => ({ detail: 'Network error' }));
          console.log('Error response data:', errorData);
          
          // Handle different error formats
          let errorMessage: string;
          if (Array.isArray(errorData.detail)) {
            // Validation errors - join all error messages
            errorMessage = errorData.detail.map((err: ValidationError) => err.msg).join(', ');
          } else {
            // Simple string error
            errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
          }
          
          console.log('Processed error message:', errorMessage);
          throw new Error(errorMessage);
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
    if (filters.owner_id) params.append('owner_id', filters.owner_id);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.is_featured !== undefined) params.append('is_featured', filters.is_featured.toString());
    if (filters.format) params.append('format', filters.format);
    if (filters.scale) params.append('scale', filters.scale);

    const queryString = params.toString();
    const endpoint = `/api/v1/competitions/${queryString ? `?${queryString}` : ''}`;
    
    return this.request<CompetitionsResponse>(endpoint);
  }

  async getCompetition(id: string): Promise<Competition> {
    return this.request<Competition>(`/api/v1/competitions/${id}`);
  }

  async createCompetition(data: CompetitionCreate, token: string): Promise<Competition> {
    console.log('Creating competition with data:', data);
    console.log('JSON stringified data:', JSON.stringify(data));
    
    return this.request<Competition>('/api/v1/competitions/', {
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