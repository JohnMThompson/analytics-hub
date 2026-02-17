/**
 * API Client Service
 * Centralized HTTP client for all backend API calls
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = {
  /**
   * Generic fetch wrapper with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  },

  /**
   * Get list of available dashboards
   */
  async getDashboards() {
    return this.request('/api/dashboards');
  },

  /**
   * Get dashboard metadata by ID
   */
  async getDashboard(dashboardId) {
    return this.request(`/api/dashboards/${dashboardId}`);
  },

  /**
   * Get dashboard data by ID
   */
  async getDashboardData(dashboardId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/dashboards/${dashboardId}/data${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  },

  /**
   * Get specific dashboard endpoint data
   */
  async getDashboardEndpoint(dashboardId, endpointName, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/dashboards/${dashboardId}/${endpointName}${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  },

  /**
   * Health check
   */
  async healthCheck() {
    return this.request('/api/health');
  },
};

export default apiClient;
