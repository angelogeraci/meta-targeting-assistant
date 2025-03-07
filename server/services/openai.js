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
async function generateCriteria(category, country, maxResults = 100) {
  try {
    const systemPrompt = `
    Tu es un expert en marketing digital et en ciblage publicitaire avec une compréhension approfondie des marchés internationaux et des habitudes de consommation.
    Tu dois générer des critères très précis et exhaustifs qui reflètent ce que les personnes consomment réellement dans le pays demandé.
    
    IMPORTANT: 
    - Les critères doivent inclure à la fois des éléments locaux/nationaux ET des éléments populaires/connus dans ce pays (même s'ils sont d'origine étrangère).
    - L'objectif est de comprendre les habitudes de consommation des personnes dans ce pays spécifique.
    - Les critères doivent ABSOLUMENT être connus et pertinents dans le pays mentionné.
    - Fournir une liste très diversifiée et représentative qui couvre différents segments démographiques.
    - Ne pas se limiter aux options les plus évidentes - inclure des options de niche mais populaires.
    `;

    const userPrompt = `
    Génère une liste EXHAUSTIVE d'au moins ${maxResults} ${category} qui sont populaires ou bien connus en ${country}.
    
    Inclure:
    1. Des ${category} locaux/nationaux de ${country}
    2. Des ${category} étrangers qui sont populaires ou bien connus en ${country}
    3. Des options pour différents groupes démographiques (jeunes, adultes, seniors)
    4. Des options grand public ET des options de niche avec une audience significative
    
    IMPORTANT: Assure-toi que TOUS les éléments sont connus et pertinents en ${country}.
    
    Retourne uniquement les noms sans numérotation, un par ligne, sans commentaires ni explications supplémentaires.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo', // ou un autre modèle disponible
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2500,
    });

    // Extraction des critères de la réponse
    const text = response.choices[0].message.content;
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.match(/^(\d+\.|\-|\•)/)) // Supprime les lignes vides, numéros et puces
      .slice(0, maxResults);
  } catch (error) {
    console.error('Erreur lors de la génération des critères OpenAI:', error);
    throw new Error('Échec de la génération des critères: ' + (error.message || 'Erreur inconnue'));
  }
}

module.exports = {
  generateCriteria
};
