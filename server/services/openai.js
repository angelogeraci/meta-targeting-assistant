const { OpenAI } = require('openai');

// Création de l'instance OpenAI avec la clé API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Génère des critères pour une catégorie et un pays spécifiques
 * @param {string} category - Catégorie (ex: "automobiles", "chanteurs")
 * @param {string} country - Pays (ex: "Belgique", "France")
 * @param {number} maxResults - Nombre maximum de critères à générer
 * @returns {Promise<string[]>} - Liste des critères générés
 */
async function generateCriteria(category, country, maxResults = 50) {
  try {
    const prompt = `Génère une liste de ${maxResults} ${category} populaires en ${country}. 
    Retourne uniquement les noms sans numérotation, un par ligne. 
    Assure-toi qu'ils sont spécifiques à ${country}.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo', // ou un autre modèle disponible
      messages: [
        { role: 'system', content: 'Tu es un expert en marketing qui connaît très bien les spécificités locales.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    // Extraction des critères de la réponse
    const text = response.choices[0].message.content;
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.match(/^\d+\./)) // Supprime les lignes vides et les numéros
      .slice(0, maxResults);
  } catch (error) {
    console.error('Erreur lors de la génération des critères OpenAI:', error);
    throw new Error('Échec de la génération des critères');
  }
}

module.exports = {
  generateCriteria
};
