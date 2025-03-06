const similarity = require('similarity');

/**
 * Calcule la similarité entre deux chaînes de caractères
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @returns {number} - Score de similarité entre 0 et 1
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) {
    return 0;
  }
  
  // Normalisation des chaînes
  const normalize = (str) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Supprime les caractères spéciaux
      .replace(/\s+/g, ' ');   // Remplace les espaces multiples par un seul
  };
  
  const normalizedStr1 = normalize(str1);
  const normalizedStr2 = normalize(str2);
  
  // Calcul de la similarité
  return similarity(normalizedStr1, normalizedStr2);
}

/**
 * Trouve les meilleures suggestions Meta pour un critère donné
 * @param {string} criterion - Critère original d'OpenAI
 * @param {Array} metaSuggestions - Liste des suggestions de Meta
 * @param {number} threshold - Seuil de similarité minimum (0-1)
 * @returns {Array} - Suggestions triées par score de similarité
 */
function findBestMatches(criterion, metaSuggestions, threshold = 0.3) {
  if (!metaSuggestions || metaSuggestions.length === 0) {
    return [];
  }
  
  // Calcul des scores de similarité pour chaque suggestion
  const matches = metaSuggestions.map(suggestion => {
    const score = calculateSimilarity(criterion, suggestion.name);
    return {
      ...suggestion,
      similarity_score: parseFloat(score.toFixed(2))
    };
  });
  
  // Filtrage des résultats par seuil et tri par score
  return matches
    .filter(match => match.similarity_score >= threshold)
    .sort((a, b) => b.similarity_score - a.similarity_score);
}

module.exports = {
  calculateSimilarity,
  findBestMatches
};
