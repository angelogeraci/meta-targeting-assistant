import axios from 'axios';

/**
 * Service for interacting with Soprism API through our backend proxy
 */
const soprismService = {
  /**
   * Authenticate to Soprism API
   * @param {Object} credentials - Username and password
   * @returns {Promise} - Authentication response
   */
  authenticate: async (credentials) => {
    try {
      const response = await axios.post('/api/soprism/authenticate', credentials);
      return response.data;
    } catch (error) {
      console.error('Soprism authentication error:', error);
      throw error;
    }
  },

  /**
   * Export data to Soprism
   * @param {Object} data - Export configuration and results
   * @param {string} token - Authentication token
   * @returns {Promise} - Export response
   */
  exportData: async (data, token) => {
    try {
      const response = await axios.post('/api/soprism/export', data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Soprism export error:', error);
      throw error;
    }
  },

  /**
   * Verify that export configuration is valid
   * @param {Object} config - Export configuration
   * @returns {boolean} - Is configuration valid
   */
  validateExportConfig: (config) => {
    const { universeName, countryRef } = config;
    
    if (!universeName || !universeName.trim()) {
      return false;
    }
    
    if (!countryRef || !countryRef.trim()) {
      return false;
    }
    
    return true;
  },
  
  /**
   * Convert results to Soprism format
   * @param {Array} results - Application results
   * @returns {Array} - Formatted results for Soprism
   */
  formatResultsForSoprism: (results) => {
    return results.map(result => {
      return {
        name: result.criterion,
        category: result.category || result.categoryPath || '',
        meta_id: result.bestMatch ? result.bestMatch.id : '',
        meta_name: result.bestMatch ? result.bestMatch.name : '',
        audience_size: result.bestMatch ? result.bestMatch.audience_size : 0
      };
    });
  }
};

export default soprismService;