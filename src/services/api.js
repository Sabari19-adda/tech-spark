const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('emart_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('emart_token', token);
    } else {
      localStorage.removeItem('emart_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.blob();
      }
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // Product methods
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async approveProduct(id) {
    return this.request(`/products/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectProduct(id) {
    return this.request(`/products/${id}/reject`, {
      method: 'POST',
    });
  }

  async transferStock(id, amount) {
    return this.request(`/products/${id}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async generateBarcode(id) {
    return this.request(`/products/${id}/barcode`, {
      method: 'POST',
    });
  }

  async getCategories() {
    return this.request('/products/meta/categories');
  }

  // Alert methods
  async getAlerts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/alerts${queryString ? `?${queryString}` : ''}`);
  }

  async getAlertStats() {
    return this.request('/alerts/stats');
  }

  async resolveAlert(id) {
    return this.request(`/alerts/${id}/resolve`, {
      method: 'POST',
    });
  }

  async sendAlertEmail(id) {
    return this.request(`/alerts/${id}/send-email`, {
      method: 'POST',
    });
  }

  async createAlert(alertData) {
    return this.request('/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  }

  // Invoice methods
  async getInvoices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/invoices${queryString ? `?${queryString}` : ''}`);
  }

  async getInvoice(id) {
    return this.request(`/invoices/${id}`);
  }

  async createInvoice(invoiceData) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  async updateInvoice(id, invoiceData) {
    return this.request(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceData),
    });
  }

  async generateInvoicePDF(id) {
    return this.request(`/invoices/${id}/pdf`, {
      method: 'POST',
    });
  }

  async sendInvoiceEmail(id) {
    return this.request(`/invoices/${id}/send-email`, {
      method: 'POST',
    });
  }

  async markInvoicePaid(id) {
    return this.request(`/invoices/${id}/mark-paid`, {
      method: 'POST',
    });
  }

  async getInvoiceStats() {
    return this.request('/invoices/stats/summary');
  }

  // Upload methods
  async uploadCSV(file) {
    const formData = new FormData();
    formData.append('csvFile', file);

    return this.request('/upload/csv', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });
  }

  async downloadSampleCSV() {
    return this.request('/upload/sample-csv', {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
  }
}

export default new ApiService();