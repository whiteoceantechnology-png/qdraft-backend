/**
 * QB Server Admin - API Service
 * 
 * JWT Authentication Flow:
 * 1. Login with username/password -> receives access_token (raw JWT)
 * 2. Token is stored in localStorage as 'adminToken'
 * 3. All API requests include Authorization header with 'Bearer ' prefix
 * 4. Backend validates token format must be: 'Bearer <token>'
 * 5. On 401 responses, token is cleared and user redirected to login
 */

const API_BASE = '/api';

class ApiService {
  constructor() {
    // Load JWT token from localStorage on initialization
    this.token = localStorage.getItem('adminToken');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('adminToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  }

  getUser() {
    const user = localStorage.getItem('adminUser');
    return user ? JSON.parse(user) : null;
  }

  setUser(user) {
    localStorage.setItem('adminUser', JSON.stringify(user));
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add JWT token to Authorization header if available
    if (this.token) {
      // Add 'Bearer ' prefix as required by the backend
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle unauthorized responses
        if (response.status === 401) {
          this.clearToken();
          window.location.href = '/admin/#/login';
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Request to root-level endpoints (not prefixed with /api)
  async rootRequest(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          window.location.href = '/admin/#/login';
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    // Backend returns access_token (raw JWT without prefix)
    if (response.access_token) {
      this.setToken(response.access_token);
      this.setUser(response);
    }

    return response;
  }

  async getCurrentUser() {
    try {
      return await this.request('/auth/me');
    } catch (error) {
      // Token is invalid, clear it
      this.clearToken();
      throw error;
    }
  }

  async changePassword(oldPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  async logout() {
    this.clearToken();
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Tenants
  async getTenants(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/tenants${query ? '?' + query : ''}`);
  }

  async getTenant(id) {
    return this.request(`/tenants/${id}`);
  }

  async createTenant(data) {
    return this.request('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTenant(id, data) {
    return this.request(`/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTenant(id) {
    return this.request(`/tenants/${id}`, {
      method: 'DELETE',
    });
  }

  // Users
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users${query ? '?' + query : ''}`);
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async createUser(data) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Questions
  async getQuestions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/questions${query ? '?' + query : ''}`);
  }

  async getQuestion(id) {
    return this.request(`/questions/${id}`);
  }

  async createQuestion(data) {
    return this.request('/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuestion(id, data) {
    return this.request(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuestion(id) {
    return this.request(`/questions/${id}`, {
      method: 'DELETE',
    });
  }

  // Chapters
  async getChapters(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/chapters${query ? '?' + query : ''}`);
  }

  async getChapter(id) {
    return this.request(`/chapters/${id}`);
  }

  async createChapter(data) {
    return this.request('/chapters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateChapter(id, data) {
    return this.request(`/chapters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteChapter(id) {
    return this.request(`/chapters/${id}`, {
      method: 'DELETE',
    });
  }

  // Exams
  async getExams(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/exams${query ? '?' + query : ''}`);
  }

  async getExam(id) {
    return this.request(`/exams/${id}`);
  }

  async createExam(data) {
    return this.request('/exams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExam(id, data) {
    return this.request(`/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExam(id) {
    return this.request(`/exams/${id}`, {
      method: 'DELETE',
    });
  }

  // Health Check & Monitoring (root-level endpoints, not under /api)
  async getHealth() {
    return this.rootRequest('/health/detailed');
  }

  async getMetrics() {
    return this.rootRequest('/metrics');
  }

  async getCacheStats() {
    return this.rootRequest('/cache/stats');
  }

  async flushCache() {
    return this.rootRequest('/cache/flush', {
      method: 'POST',
    });
  }

  // Subjects
  async getSubjects(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/subjects${query ? '?' + query : ''}`);
  }

  async getSubject(id) {
    return this.request(`/subjects/${id}`);
  }

  async createSubject(data) {
    return this.request('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubject(id, data) {
    return this.request(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSubject(id) {
    return this.request(`/subjects/${id}`, {
      method: 'DELETE',
    });
  }

  async assignSubjectToUser(userId, subjectId) {
    return this.request('/subjects/assign', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, subject_id: subjectId }),
    });
  }

  async removeSubjectFromUser(userId) {
    return this.request(`/subjects/assign/${userId}`, {
      method: 'DELETE',
    });
  }

  async getUsersBySubject(subjectId) {
    return this.request(`/subjects/${subjectId}/users`);
  }

  // Question Types
  async getQuestionTypes(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/questiontypes${query ? '?' + query : ''}`);
  }

  async getQuestionType(id) {
    return this.request(`/questiontypes/${id}`);
  }

  async createQuestionType(data) {
    return this.request('/questiontypes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuestionType(id, data) {
    return this.request(`/questiontypes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuestionType(id) {
    return this.request(`/questiontypes/${id}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton
const api = new ApiService();
