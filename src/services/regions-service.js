import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const regionsService = {
  // Get all regions with pagination and filters
  async getRegions(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/master-survey-regions`, {
        params: {
          per_page: params.perPage || 15,
          page: params.page || 1,
          is_active: params.isActive !== undefined ? params.isActive : undefined,
          search: params.search || undefined,
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching regions:', error);
      throw error;
    }
  },

  // Get single region by ID
  async getRegion(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/master-survey-regions/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching region:', error);
      throw error;
    }
  },

  // Create new region
  async createRegion(data) {
    try {
      const response = await axios.post(`${API_BASE_URL}/master-survey-regions`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating region:', error);
      throw error;
    }
  },

  // Update existing region
  async updateRegion(id, data) {
    try {
      const response = await axios.put(`${API_BASE_URL}/master-survey-regions/${id}`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error updating region:', error);
      throw error;
    }
  },

  // Delete region
  async deleteRegion(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/master-survey-regions/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting region:', error);
      throw error;
    }
  },

  // Check if coordinates are covered by any region
  async checkCoverage(latitude, longitude) {
    try {
      const response = await axios.post(`${API_BASE_URL}/master-survey-regions/check-coverage`, {
        latitude,
        longitude,
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error checking coverage:', error);
      throw error;
    }
  },

  // Get nearby regions
  async getNearbyRegions(latitude, longitude, radiusKm = 50) {
    try {
      const response = await axios.post(`${API_BASE_URL}/master-survey-regions/nearby`, {
        latitude,
        longitude,
        radius_km: radiusKm,
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error getting nearby regions:', error);
      throw error;
    }
  },
};

export default regionsService;
