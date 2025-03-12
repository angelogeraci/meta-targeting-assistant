const axios = require('axios');

// Constants
const BASE_URL = 'https://graph.facebook.com';
const API_VERSION = 'v19.0'; // Use the most recent version

// File d'attente pour les intérêts avec audience de taille 0
let zeroAudienceQueue = [];
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Vérifie si le token d'accès Meta est valide et a les autorisations nécessaires
 * @returns {Promise<boolean>} - True si le token est valide, false sinon
 */
async function checkMetaAccessToken() {
  try {
    const url = `${BASE_URL}/${API_VERSION}/me/permissions`;
    
    const params = {
      access_token: process.env.META_ACCESS_TOKEN
    };

    const response = await axios.get(url, { params });
    
    // Vérifier si la réponse contient des données
    if (!response.data || !response.data.data) {
      console.error('Invalid response from Meta API when checking permissions');
      return false;
    }

    // Vérifier si les autorisations ads_management ou ads_read sont présentes
    const permissions = response.data.data;
    const hasAdsPermission = permissions.some(
      perm => (perm.permission === 'ads_management' || perm.permission === 'ads_read') && perm.status === 'granted'
    );

    if (!hasAdsPermission) {
      console.error('Le token Meta n\'a pas les autorisations ads_management ou ads_read nécessaires');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification du token Meta:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Get Meta interest suggestions for a criterion
 * @param {string} query - The criterion to search for
 * @param {string} countryCode - ISO country code (e.g., BE for Belgium)
 * @returns {Promise<Array>} - List of suggestions
 */
async function getTargetingSuggestions(query, countryCode) {
  try {
    // Vérifier si le token d'accès est valide
    const isTokenValid = await checkMetaAccessToken();
    if (!isTokenValid) {
      throw new Error('Le token d\'accès Meta n\'est pas valide ou n\'a pas les autorisations nécessaires');
    }

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
    const results = response.data.data.map(item => ({
      id: item.id,
      name: item.name,
      audience_size: item.audience_size,
      path: item.path || [],
      description: item.description || '',
      topic: item.topic || '',
    }));

    // Get country-specific audience size for each interest
    const resultsWithCountryAudience = await Promise.all(
      results.map(async (result) => {
        try {
          const countryAudience = await getInterestAudienceSize(result.id, countryCode);
          
          // Si l'audience est 0, ajouter à la file d'attente pour réessayer plus tard
          if (countryAudience === 0) {
            zeroAudienceQueue.push({
              interestId: result.id,
              countryCode,
              criterion: query,
              attempts: 0
            });
          }
          
          return {
            ...result,
            country_audience_size: countryAudience
          };
        } catch (error) {
          console.error(`Error getting audience size for interest ${result.id}:`, error.message);
          return {
            ...result,
            country_audience_size: null
          };
        }
      })
    );

    return resultsWithCountryAudience;
  } catch (error) {
    console.error('Error retrieving Meta suggestions:', error.response?.data || error.message);
    throw new Error('Failed to retrieve Meta suggestions');
  }
}

/**
 * Get audience size for a specific interest in a specific country
 * @param {string} interestId - The interest ID
 * @param {string} countryCode - ISO country code (e.g., BE for Belgium)
 * @returns {Promise<number>} - Audience size
 */
async function getInterestAudienceSize(interestId, countryCode) {
  try {
    // Vérifier si l'ID du compte publicitaire est défini
    const adAccountId = process.env.META_AD_ACCOUNT_ID;
    if (!adAccountId) {
      console.error('META_AD_ACCOUNT_ID is not defined in .env file');
      return null;
    }

    // Utiliser l'ID du compte publicitaire directement (sans ajouter "act_" s'il est déjà inclus)
    const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    
    const url = `${BASE_URL}/${API_VERSION}/${accountId}/delivery_estimate`;
    
    const params = {
      access_token: process.env.META_ACCESS_TOKEN,
      targeting_spec: JSON.stringify({
        geo_locations: {
          countries: [countryCode],
        },
        interests: [{ id: interestId }],
      }),
      optimization_goal: 'REACH'
    };

    const response = await axios.get(url, { params });
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      const estimate = response.data.data[0];
      return estimate.estimate_ready ? estimate.estimate_dau : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving audience size:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Traite la file d'attente des intérêts avec audience de taille 0
 * @returns {Promise<Object>} - Résultats des nouvelles tentatives
 */
async function processZeroAudienceQueue() {
  console.log(`Processing zero audience queue with ${zeroAudienceQueue.length} items`);
  
  if (zeroAudienceQueue.length === 0) {
    return { processed: 0, updated: 0 };
  }
  
  const results = {
    processed: 0,
    updated: 0,
    updatedInterests: []
  };
  
  // Copier la file d'attente actuelle et la vider
  const currentQueue = [...zeroAudienceQueue];
  zeroAudienceQueue = [];
  
  // Traiter chaque élément de la file d'attente
  for (const item of currentQueue) {
    results.processed++;
    
    // Si le nombre maximum de tentatives est atteint, ignorer
    if (item.attempts >= MAX_RETRY_ATTEMPTS) {
      continue;
    }
    
    // Incrémenter le nombre de tentatives
    item.attempts++;
    
    try {
      // Réessayer de récupérer la taille de l'audience
      const audienceSize = await getInterestAudienceSize(item.interestId, item.countryCode);
      
      // Si l'audience est toujours 0 et que le nombre max de tentatives n'est pas atteint, remettre dans la file
      if (audienceSize === 0 && item.attempts < MAX_RETRY_ATTEMPTS) {
        zeroAudienceQueue.push(item);
      } 
      // Si l'audience n'est plus 0, enregistrer le résultat
      else if (audienceSize > 0) {
        results.updated++;
        results.updatedInterests.push({
          interestId: item.interestId,
          criterion: item.criterion,
          audienceSize
        });
      }
    } catch (error) {
      console.error(`Error retrying audience size for interest ${item.interestId}:`, error.message);
      
      // Si le nombre max de tentatives n'est pas atteint, remettre dans la file
      if (item.attempts < MAX_RETRY_ATTEMPTS) {
        zeroAudienceQueue.push(item);
      }
    }
    
    // Attendre un court délai pour éviter de surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
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
  getInterestAudienceSize,
  getCountryCode,
  checkMetaAccessToken,
  processZeroAudienceQueue
};
