/**
 * API service layer for frontend-backend communication
 */

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }

    return data.data;
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
  login: async (credentials: { username: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    if (response.token) {
      tokenStorage.set(response.token);
    }
    return response;
  },

  register: async (userData: {
    username: string;
    password: string;
    role: string;
    name: string;
    email: string;
    department?: string;
    current_semester?: number;
  }) => {
    const response = await api.post('/auth/register', userData);
    if (response.token) {
      tokenStorage.set(response.token);
    }
    return response;
  },

  logout: () => {
    tokenStorage.remove();
  },
};

// Students API
export const studentsApi = {
  getProfile: () => api.get('/students/profile'),
  updateProfile: (profileData: any) => api.put('/students/profile', profileData),
};

// Internships API
export const internshipsApi = {
  getAll: (department?: string) => {
    const params = department ? `?department=${encodeURIComponent(department)}` : '';
    return api.get(`/internships${params}`);
  },
  getById: (id: number) => api.get(`/internships/${id}`),
  create: (internshipData: any) => api.post('/internships', internshipData),
  update: (id: number, internshipData: any) => api.put(`/internships/${id}`, internshipData),
  delete: (id: number) => api.delete(`/internships/${id}`),
};

// Applications API
export const applicationsApi = {
  getAll: (status?: string) => {
    const params = status ? `?status=${encodeURIComponent(status)}` : '';
    return api.get(`/applications${params}`);
  },
  create: (applicationData: { internship_id: number }) => api.post('/applications', applicationData),
  approve: (id: number) => api.put(`/applications/${id}/approve`),
  reject: (id: number) => api.put(`/applications/${id}/reject`),
};

// Feedback API
export const feedbackApi = {
  getAll: (applicationId?: number) => {
    const params = applicationId ? `?applicationId=${applicationId}` : '';
    return api.get(`/feedback${params}`);
  },
  create: (feedbackData: { application_id: number; rating: number; comments?: string }) =>
    api.post('/feedback', feedbackData),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

// Error handling utility
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  if (error.message.includes('401') || error.message.includes('Invalid or expired token')) {
    authApi.logout();
    window.location.href = '/login';
  }
  return error.message || 'An unexpected error occurred';
};