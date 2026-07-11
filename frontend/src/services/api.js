import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = {
  // Scraping endpoints
  scrapeInstitutions: async (params) => {
    const response = await axios.post(`${API_URL}/scrape`, params);
    return response.data;
  },

  getInstitutions: async (filters = {}) => {
    const params = {
      ...filters,
      limit: filters.limit || '1000'
    };

    const response = await axios.get(`${API_URL}/institutions`, { params });
    return response.data;
  },

  getStatistics: async () => {
    const response = await axios.get(`${API_URL}/statistics`);
    return response.data;
  },

  exportData: async (format = 'json') => {
    const response = await axios.get(`${API_URL}/export`, {
      params: { format },
      responseType: 'blob'
    });

    return response.data;
  }
};

export default api;