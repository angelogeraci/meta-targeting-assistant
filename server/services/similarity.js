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
    const score = calculateSimilarity(criterion, suggestion.name);
    return {
      ...suggestion,
      similarity_score: parseFloat(score.toFixed(2))
    };
  });
  
  // Filter results by threshold and sort by score
  return matches
    .filter(match => match.similarity_score >= threshold)
    .sort((a, b) => b.similarity_score - a.similarity_score);
}

module.exports = {
  calculateSimilarity,
  findBestMatches
};
