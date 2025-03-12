const similarity = require('similarity');

/**
 * Calculate similarity between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) {
    return 0;
  }
  
  // String normalization
  const normalize = (str) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ');   // Replace multiple spaces with a single one
  };
  
  const normalizedStr1 = normalize(str1);
  const normalizedStr2 = normalize(str2);
  
  // Calculate similarity
  return similarity(normalizedStr1, normalizedStr2);
}

/**
 * Analyze if a suggestion is contextually relevant to the criterion
 * @param {string} criterion - Original criterion (e.g., "Singers")
 * @param {object} suggestion - Meta suggestion object
 * @returns {number} - Context relevance bonus (0-0.2)
 */
function analyzeContextRelevance(criterion, suggestion) {
  let contextBonus = 0;
  const criterionLower = criterion.toLowerCase();
  const nameLower = suggestion.name.toLowerCase();
  const path = suggestion.path || [];
  const pathString = path.join(' ').toLowerCase();
  const description = (suggestion.description || '').toLowerCase();
  
  // Check if the criterion appears in the path or description
  if (pathString.includes(criterionLower) || description.includes(criterionLower)) {
    contextBonus += 0.1;
  }
  
  // Check for category matches (e.g., if searching for "Singers", prioritize music-related results)
  const categoryKeywords = {
    'singer': ['music', 'artist', 'vocal', 'band', 'performer'],
    'actor': ['movie', 'film', 'television', 'tv', 'cinema', 'theater'],
    'athlete': ['sport', 'team', 'player', 'championship', 'olympic'],
    'politician': ['politics', 'government', 'party', 'election', 'minister'],
    'writer': ['book', 'author', 'novel', 'literature', 'publication'],
    'artist': ['art', 'painting', 'gallery', 'creative', 'design'],
    // Add more categories as needed
  };
  
  // Find matching category
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (criterionLower.includes(category)) {
      // Check if any keywords from this category appear in the suggestion
      for (const keyword of keywords) {
        if (nameLower.includes(keyword) || pathString.includes(keyword) || description.includes(keyword)) {
          contextBonus += 0.1;
          break; // Only add the bonus once per category
        }
      }
    }
  }
  
  return contextBonus;
}

/**
 * Find the best Meta suggestions for a given criterion
 * @param {string} criterion - Original OpenAI criterion
 * @param {Array} metaSuggestions - List of Meta suggestions
 * @param {number} threshold - Minimum similarity threshold (0-1)
 * @returns {Array} - Suggestions sorted by similarity score
 */
function findBestMatches(criterion, metaSuggestions, threshold = 0.3) {
  if (!metaSuggestions || metaSuggestions.length === 0) {
    return [];
  }
  
  // Calculate similarity scores for each suggestion
  const matches = metaSuggestions.map(suggestion => {
    // Base similarity score
    const baseScore = calculateSimilarity(criterion, suggestion.name);
    
    // Context relevance bonus
    const contextBonus = analyzeContextRelevance(criterion, suggestion);
    
    // Combine scores (capped at 1.0)
    const finalScore = Math.min(baseScore + contextBonus, 1.0);
    
    return {
      ...suggestion,
      similarity_score: parseFloat(finalScore.toFixed(2))
    };
  });
  
  // Group suggestions by name to handle duplicates
  const groupedByName = {};
  matches.forEach(match => {
    const name = match.name.toLowerCase();
    if (!groupedByName[name] || 
        (match.country_audience_size && match.country_audience_size > (groupedByName[name].country_audience_size || 0))) {
      groupedByName[name] = match;
    }
  });
  
  // Convert back to array
  const uniqueMatches = Object.values(groupedByName);
  
  // Filter results by threshold and sort by score
  return uniqueMatches
    .filter(match => match.similarity_score >= threshold)
    .sort((a, b) => {
      // First sort by similarity score
      const scoreDiff = b.similarity_score - a.similarity_score;
      
      // If scores are very close (within 0.1), prefer the one with larger audience
      if (Math.abs(scoreDiff) < 0.1 && a.country_audience_size && b.country_audience_size) {
        return b.country_audience_size - a.country_audience_size;
      }
      
      return scoreDiff;
    });
}

module.exports = {
  calculateSimilarity,
  findBestMatches
};
