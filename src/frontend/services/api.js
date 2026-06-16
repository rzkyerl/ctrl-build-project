const API_BASE_URL = 'http://localhost:3000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async logout() {
    this.setToken(null);
  }

  async getPortfolios() {
    return this.request('/portfolio');
  }

  async getPortfolioById(id) {
    return this.request(`/portfolio/${id}`);
  }

  async getPortfolioBySlug(slug) {
    return this.request(`/portfolio/slug/${slug}`);
  }

  async createPortfolio(data) {
    return this.request('/portfolio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePortfolio(id, data) {
    return this.request(`/portfolio/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePortfolio(id) {
    return this.request(`/portfolio/${id}`, {
      method: 'DELETE',
    });
  }

  async getStacks() {
    return this.request('/stacks');
  }

  async getStack(id) {
    return this.request(`/stacks/${id}`);
  }

  async createStack(data) {
    return this.request('/stacks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStack(id, data) {
    return this.request(`/stacks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteStack(id) {
    return this.request(`/stacks/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
