/**
 * Formate une date ISO en chaîne lisible
 * @param {string} dateString - Chaîne de date ISO
 * @param {object} options - Options de formatage
 * @returns {string} - Date formatée
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    // Options par défaut
    const defaultOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };
    
    return date.toLocaleDateString('fr-FR', defaultOptions);
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return dateString;
  }
};

/**
 * Formate un nombre avec séparateurs de milliers
 * @param {number} number - Nombre à formater
 * @param {number} decimals - Nombre de décimales
 * @returns {string} - Nombre formaté
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return '-';
  
  try {
    return number.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  } catch (error) {
    console.error('Erreur de formatage de nombre:', error);
    return number.toString();
  }
};

/**
 * Tronque un texte à une longueur spécifiée et ajoute des points de suspension
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} - Texte tronqué
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Formate un pourcentage
 * @param {number} value - Valeur à formater (0.1 = 10%)
 * @param {number} decimals - Nombre de décimales
 * @returns {string} - Pourcentage formaté
 */
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '-';
  
  try {
    return `${(value * 100).toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}%`;
  } catch (error) {
    console.error('Erreur de formatage de pourcentage:', error);
    return `${value * 100}%`;
  }
};
