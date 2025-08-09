import { apiRequest } from './utils';

export interface User {
  id: string;
  email: string;
  full_name: string;
  organization?: string;
  phone_number?: string;
  role: 'ADMIN' | 'CREATOR';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  id: string;
  email: string;
  full_name: string;
  organization?: string;
  role: 'ADMIN' | 'CREATOR';
  is_active: boolean;
  created_at: string;
}

export interface UserListPaginatedResponse {
  users: UserListResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface UserDetailResponse {
  id: string;
  email: string;
  full_name: string;
  organization?: string;
  phone_number?: string;
  role: 'ADMIN' | 'CREATOR';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserUpdate {
  full_name?: string;
  organization?: string;
  phone_number?: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

class UsersAPI {
  // Get current user profile
  async getCurrentUser(): Promise<UserDetailResponse> {
    return apiRequest<UserDetailResponse>('/api/v1/users/me', { requireAuth: true });
  }

  // Update current user profile
  async updateCurrentUser(data: UserUpdate): Promise<UserDetailResponse> {
    return apiRequest<UserDetailResponse>('/api/v1/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  // Change current user password
  async changePassword(data: PasswordChange): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/api/v1/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  // Admin endpoints (admin auth required)

  // List users with pagination/filters
  async getUsers(params?: {
    skip?: number;
    limit?: number;
    role?: 'ADMIN' | 'CREATOR';
    is_active?: boolean;
    search?: string;
  }): Promise<UserListPaginatedResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = `/api/v1/users${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<UserListPaginatedResponse>(endpoint, { requireAuth: true });
  }

  // Delete user by ID
  async deleteUser(userId: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/v1/users/${userId}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  }

  // Deactivate user
  async deactivateUser(userId: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/v1/users/${userId}/deactivate`, {
      method: 'PUT',
      requireAuth: true,
    });
  }

  // Activate user
  async activateUser(userId: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/v1/users/${userId}/activate`, {
      method: 'PUT',
      requireAuth: true,
    });
  }

  // Change user role
  async changeUserRole(userId: string, newRole: 'ADMIN' | 'CREATOR'): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/v1/users/${userId}/role?new_role=${newRole}`, {
      method: 'PUT',
      requireAuth: true,
    });
  }
}

export const usersAPI = new UsersAPI();
