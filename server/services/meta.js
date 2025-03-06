const axios = require('axios');

// Constantes
const BASE_URL = 'https://graph.facebook.com';
const API_VERSION = 'v19.0'; // Utilisez la version la plus récente

/**
 * Récupère des suggestions d'intérêts Meta pour un critère
 * @param {string} query - Le critère à rechercher
 * @param {string} countryCode - Code pays ISO (ex: BE pour Belgique)
 * @returns {Promise<Array>} - Liste des suggestions
 */
async function getTargetingSuggestions(query, countryCode) {
  try {
    const url = `${BASE_URL}/${API_VERSION}/search`;
    
    const params = {
      access_token: process.env.META_ACCESS_TOKEN,
      type: 'adinterest',
      q: query,
      limit: 20,
      locale: 'fr_FR', // Peut être modifié en fonction du pays
      targeting_spec: JSON.stringify({
        geo_locations: {
          countries: [countryCode],
        },
      }),
    };

    const response = await axios.get(url, { params });
    
    // Vérifier si la réponse contient des données
    if (!response.data || !response.data.data || response.data.data.length === 0) {
      return [];
    }

    // Extraction et formatage des résultats
    return response.data.data.map(item => ({
      id: item.id,
      name: item.name,
      audience_size: item.audience_size,
      path: item.path || [],
      description: item.description || '',
      topic: item.topic || '',
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions Meta:', error.response?.data || error.message);
    throw new Error('Échec de la récupération des suggestions Meta');
  }
}

/**
 * Convertit un nom de pays en code ISO à deux lettres
 * @param {string} country - Nom du pays (ex: "Belgique")
 * @returns {string} - Code ISO du pays (ex: "BE")
 */
function getCountryCode(country) {
  const countryMap = {
    'belgique': 'BE',
    'france': 'FR',
    'suisse': 'CH',
    'canada': 'CA',
    'états-unis': 'US',
    'etats-unis': 'US',
    'allemagne': 'DE',
    'royaume-uni': 'GB',
    'espagne': 'ES',
    'italie': 'IT',
    'pays-bas': 'NL',
    'portugal': 'PT',
    // Ajoutez d'autres pays selon vos besoins
  };

  const normalizedCountry = country.toLowerCase().trim();
  return countryMap[normalizedCountry] || 'US'; // Par défaut US si le pays n'est pas trouvé
}

module.exports = {
  getTargetingSuggestions,
  getCountryCode,
};
