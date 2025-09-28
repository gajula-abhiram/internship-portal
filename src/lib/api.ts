/**
 * API service layer for frontend-backend communication
 */

// Type definitions
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
  role: string;
  name: string;
  email: string;
  department?: string;
  current_semester?: number;
}

interface AuthResponse {
  user: any;
  token: string;
  message?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Auth token management - SSR safe
export const tokenStorage = {
  get: () => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.warn('Failed to access localStorage:', error);
      return null;
    }
  },
  set: (token: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('token', token);
    } catch (error) {
      console.warn('Failed to set token in localStorage:', error);
    }
  },
  remove: () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('token');
    } catch (error) {
      console.warn('Failed to remove token from localStorage:', error);
    }
  },
};

// API client with auth headers
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    try {
      const token = tokenStorage.get();
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      let data: any;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError);
        throw new Error(`Invalid response format from server (${response.status})`);
      }

      if (!response.ok) {
        // Handle structured error responses
        const errorMessage = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('API Error:', {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          error: data
        });
        throw new Error(errorMessage);
      }

      // Return the data property if it exists, otherwise return the full response
      return data?.data !== undefined ? data.data : data;
    } catch (error) {
      // Handle network errors and other fetch failures
      if (error instanceof Error) {
        console.error('API Request failed:', {
          endpoint,
          message: error.message,
          stack: error.stack
        });
        throw error;
      }
      
      console.error('Unknown API error:', error);
      throw new Error('An unexpected error occurred while making the request');
    }
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put(endpoint: string, body?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const api = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    if (response.token) {
      tokenStorage.set(response.token);
    }
    return response;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    if (response.token) {
      tokenStorage.set(response.token);
    }
    return response;
  },

  logout: (): void => {
    tokenStorage.remove();
  },
};

// Students API
export const studentsApi = {
  getProfile: (): Promise<any> => api.get('/students/profile'),
  updateProfile: (profileData: Record<string, any>): Promise<any> => api.put('/students/profile', profileData),
};

// Internships API
export const internshipsApi = {
  getAll: (department?: string): Promise<any[]> => {
    const params = department ? `?department=${encodeURIComponent(department)}` : '';
    return api.get(`/internships${params}`);
  },
  getById: (id: number): Promise<any> => api.get(`/internships/${id}`),
  create: (internshipData: Record<string, any>): Promise<any> => api.post('/internships', internshipData),
  update: (id: number, internshipData: Record<string, any>): Promise<any> => api.put(`/internships/${id}`, internshipData),
  delete: (id: number): Promise<void> => api.delete(`/internships/${id}`),
};

// Applications API
export const applicationsApi = {
  getAll: (status?: string): Promise<any[]> => {
    const params = status ? `?status=${encodeURIComponent(status)}` : '';
    return api.get(`/applications${params}`);
  },
  create: (applicationData: { internship_id: number }): Promise<any> => api.post('/applications', applicationData),
  approve: (id: number): Promise<any> => api.put(`/applications/${id}/approve`),
  reject: (id: number): Promise<any> => api.put(`/applications/${id}/reject`),
};

// Feedback API
export const feedbackApi = {
  getAll: (applicationId?: number): Promise<any[]> => {
    const params = applicationId ? `?applicationId=${applicationId}` : '';
    return api.get(`/feedback${params}`);
  },
  create: (feedbackData: { application_id: number; rating: number; comments?: string }): Promise<any> =>
    api.post('/feedback', feedbackData),
};

// Analytics API
export const analyticsApi = {
  getDashboard: (): Promise<any> => api.get('/analytics/dashboard'),
};

// Error handling utility
export const handleApiError = (error: any): string => {
  console.error('API Error:', error);
  
  // Handle different types of errors
  if (error instanceof Error) {
    const message = error.message;
    
    // Handle authentication errors
    if (message.includes('401') || 
        message.includes('Invalid or expired token') || 
        message.includes('Unauthorized')) {
      authApi.logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return 'Session expired. Please log in again.';
    }
    
    // Handle validation errors
    if (message.includes('400') || message.includes('Bad Request')) {
      return message.replace(/^HTTP \d+: /, ''); // Remove HTTP status prefix
    }
    
    // Handle server errors
    if (message.includes('500') || message.includes('Internal Server Error')) {
      return 'Server error. Please try again later.';
    }
    
    // Handle network errors
    if (message.includes('Failed to fetch') || message.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return message;
  }
  
  // Fallback for unknown error types
  return 'An unexpected error occurred. Please try again.';
};