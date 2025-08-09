import { apiRequest } from './utils';

export interface Competition {
  id: string;
  title: string;
  introduction: string;
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
  location: string;
  format: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  scale: 'PROVINCIAL' | 'REGIONAL' | 'INTERNATIONAL';
  registration_deadline: string;
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

export interface CompetitionListResponse {
  competitions: Competition[];
  total: number;
  skip: number;
  limit: number;
}

export interface CompetitionCreate {
  title: string;
  introduction: string;
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
  location: string;
  format: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  scale: 'PROVINCIAL' | 'REGIONAL' | 'INTERNATIONAL';
  registration_deadline: string;
  size?: number;
  target_age_min?: number;
  target_age_max?: number;
}

export interface CompetitionUpdate {
  title?: string;
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
}

class CompetitionsAPI {
  // Public endpoints (no auth required)
  async getCompetitions(params?: {
    skip?: number;
    limit?: number;
    format?: 'ONLINE' | 'OFFLINE' | 'HYBRID';
    scale?: 'PROVINCIAL' | 'REGIONAL' | 'INTERNATIONAL';
    location?: string;
    search?: string;
    sort_by?: 'created_at' | 'registration_deadline' | 'title';
    order?: 'asc' | 'desc';
  }): Promise<CompetitionListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = `/api/v1/competitions${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<CompetitionListResponse>(endpoint);
  }

  async getFeaturedCompetitions(params?: {
    skip?: number;
    limit?: number;
    sort_by?: 'created_at' | 'registration_deadline' | 'title';
    order?: 'asc' | 'desc';
  }): Promise<CompetitionListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = `/api/v1/competitions/featured${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<CompetitionListResponse>(endpoint);
  }

  async getCompetition(id: string): Promise<Competition> {
    return apiRequest<Competition>(`/api/v1/competitions/${id}`);
  }

  // Protected endpoints (auth required)
  async createCompetition(data: CompetitionCreate): Promise<Competition> {
    return apiRequest<Competition>('/api/v1/competitions', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  async updateCompetition(id: string, data: CompetitionUpdate): Promise<Competition> {
    return apiRequest<Competition>(`/api/v1/competitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  async deleteCompetition(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/v1/competitions/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  }

  async getMyCompetitions(params?: {
    skip?: number;
    limit?: number;
  }): Promise<CompetitionListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = `/api/v1/competitions/my/competitions${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<CompetitionListResponse>(endpoint, { requireAuth: true });
  }

  // Admin endpoints (admin auth required)
  async getPendingCompetitions(params?: {
    skip?: number;
    limit?: number;
  }): Promise<CompetitionListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = `/api/v1/admin/competitions/pending${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<CompetitionListResponse>(endpoint, { requireAuth: true });
  }

  async approveCompetition(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/v1/admin/competitions/${id}/approve`, {
      method: 'PUT',
      requireAuth: true,
    });
  }

  async rejectCompetition(id: string, rejectionReason?: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/v1/admin/competitions/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejection_reason: rejectionReason }),
      requireAuth: true,
    });
  }

  async featureCompetition(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/v1/admin/competitions/${id}/feature`, {
      method: 'PUT',
      requireAuth: true,
    });
  }

  async unfeatureCompetition(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/v1/admin/competitions/${id}/unfeature`, {
      method: 'PUT',
      requireAuth: true,
    });
  }

  async activateCompetition(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/v1/admin/competitions/${id}/activate`, {
      method: 'PUT',
      requireAuth: true,
    });
  }

  async deactivateCompetition(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/v1/admin/competitions/${id}/deactivate`, {
      method: 'PUT',
      requireAuth: true,
    });
  }
}

export const competitionsAPI = new CompetitionsAPI(); 