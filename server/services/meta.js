const axios = require('axios');

// Constants
const BASE_URL = 'https://graph.facebook.com';
const API_VERSION = 'v19.0'; // Use the most recent version

/**
 * Get Meta interest suggestions for a criterion
 * @param {string} query - The criterion to search for
 * @param {string} countryCode - ISO country code (e.g., BE for Belgium)
 * @returns {Promise<Array>} - List of suggestions
 */
async function getTargetingSuggestions(query, countryCode) {
  try {
    const url = `${BASE_URL}/${API_VERSION}/search`;
    
    const params = {
      access_token: process.env.META_ACCESS_TOKEN,
      type: 'adinterest',
      q: query,
      limit: 20,
      locale: 'en_US', // Can be modified based on the country
      targeting_spec: JSON.stringify({
        geo_locations: {
          countries: [countryCode],
        },
      }),
    };

    const response = await axios.get(url, { params });
    
    // Check if the response contains data
    if (!response.data || !response.data.data || response.data.data.length === 0) {
      return [];
    }

    // Extract and format results
    return response.data.data.map(item => ({
      id: item.id,
      name: item.name,
      audience_size: item.audience_size,
      path: item.path || [],
      description: item.description || '',
      topic: item.topic || '',
    }));
  } catch (error) {
    console.error('Error retrieving Meta suggestions:', error.response?.data || error.message);
    throw new Error('Failed to retrieve Meta suggestions');
  }
}

/**
 * Convert a country name to a two-letter ISO code
 * @param {string} country - Country name (e.g., "Belgium")
 * @returns {string} - Country ISO code (e.g., "BE")
 */
function getCountryCode(country) {
  const countryMap = {
    'belgium': 'BE',
    'france': 'FR',
    'switzerland': 'CH',
    'canada': 'CA',
    'united states': 'US',
    'germany': 'DE',
    'united kingdom': 'GB',
    'spain': 'ES',
    'italy': 'IT',
    'netherlands': 'NL',
    'portugal': 'PT',
    // Add other countries as needed
  };

  const normalizedCountry = country.toLowerCase().trim();
  return countryMap[normalizedCountry] || 'US'; // Default to US if country not found
}

module.exports = {
  getTargetingSuggestions,
  getCountryCode,
};
