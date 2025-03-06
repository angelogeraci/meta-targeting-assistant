import axios from 'axios';

const API = {
  /**
   * Récupère la liste des pays disponibles
   * @returns {Promise} - Liste des pays
   */
  getCountries: async () => {
    try {
      const response = await axios.get('/api/criteria/countries');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des pays:', error);
      throw error;
    }
  },

  /**
   * Récupère la liste des catégories disponibles
   * @returns {Promise} - Liste des catégories
   */
  getCategories: async () => {
    try {
      const response = await axios.get('/api/criteria/categories');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
  },

  /**
   * Génère des critères pour une catégorie dans un pays
   * @param {string} category - Catégorie 
   * @param {string} country - Pays
   * @param {number} maxResults - Nombre maximum de résultats
   * @returns {Promise} - Liste des critères générés
   */
  generateCriteria: async (category, country, maxResults = 50) => {
    try {
      const response = await axios.get('/api/criteria/generate', {
        params: { category, country, maxResults }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération des critères:', error);
      throw error;
    }
  },

  /**
   * Récupère des suggestions pour un critère
   * @param {string} criterion - Critère à rechercher
   * @param {string} country - Pays
   * @returns {Promise} - Suggestions Meta
   */
  getSuggestions: async (criterion, country) => {
    try {
      const response = await axios.post('/api/meta/suggestions', {
        criterion,
        country
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions:', error);
      throw error;
    }
  },

  /**
   * Traite un lot de critères pour obtenir des suggestions
   * @param {Array} criteria - Liste des critères
   * @param {string} country - Pays
   * @param {number} similarityThreshold - Seuil de similarité (0-1)
   * @returns {Promise} - Résultats du traitement
   */
  processBatchSuggestions: async (criteria, country, similarityThreshold = 0.3) => {
    try {
      const response = await axios.post('/api/meta/batch-suggestions', {
        criteria,
        country,
        similarityThreshold
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du traitement par lot:', error);
      throw error;
    }
  }
};

export default API;
