const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  avatar_url?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ApiError {
  detail: string;
}

class AuthAPI {
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
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({ detail: 'Network error' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async signUp(data: SignUpData): Promise<User> {
    return this.request<User>('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', data.email); // OAuth2 uses 'username' field
    formData.append('password', data.password);

    return this.request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type for FormData
      },
    });
  }

  async getCurrentUser(token: string): Promise<User> {
    return this.request<User>('/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async logout(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async forgotPassword(email: string): Promise<{ message: string; token?: string }> {
    return this.request<{ message: string; token?: string }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }
}

export const authAPI = new AuthAPI(); 