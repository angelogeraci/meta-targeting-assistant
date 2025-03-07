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
async function generateCriteria(category, country, maxResults = 500) {
  try {
    const systemPrompt = `
    Tu es un expert en marketing digital spécialisé dans la génération de critères de ciblage précis pour les publicités.
    
    TÂCHE:
    Génère une liste exceptionnellement longue de noms spécifiques dans la catégorie demandée qui sont pertinents pour le pays indiqué.
    
    RÈGLES STRICTES:
    1. RETOURNE UNIQUEMENT des noms précis, un par ligne, sans numérotation, sans énumération, sans préfixes, sans explications.
    2. Ne réponds jamais avec des phrases ou des explications, juste des noms.
    3. N'ajoute PAS de catégories générales ni de sous-catégories.
    4. N'inclus AUCUN texte explicatif, même pas au début ou à la fin.
    5. Chaque ligne doit contenir EXACTEMENT UN nom spécifique et rien d'autre.
    6. Ne mets jamais de guillemets, de tirets ou autres caractères décoratifs.
    7. Ne dis JAMAIS que tu ne peux pas être exhaustif.
    
    INSTRUCTIONS SPÉCIFIQUES:
    - Les critères doivent inclure à la fois des éléments locaux/nationaux de ${country} ET des éléments étrangers populaires dans ce pays.
    - Fournis le maximum de noms spécifiques possible, vise au moins ${maxResults} éléments.
    - Assure-toi que chaque nom est connu et pertinent en ${country}.
    - Couvre tous les segments démographiques (jeunes, adultes, seniors).
    `;

    const userPrompt = `
    Génère une liste EXHAUSTIVE d'au moins ${maxResults} ${category} populaires ou connus en ${country}.
    
    IMPORTANT:
    - RETOURNE UNIQUEMENT LA LISTE DE NOMS SPÉCIFIQUES, UN PAR LIGNE.
    - NE DONNE PAS D'INTRODUCTION OU DE CONCLUSION.
    - NE DIS PAS QUE LA LISTE N'EST PAS EXHAUSTIVE.
    - NE METS PAS DE NUMÉROS, DE PUCES OU DE CATÉGORIES.
    - N'AJOUTE AUCUN TEXTE EXPLICATIF.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 1.0,
      max_tokens: 4000,
      frequency_penalty: 0.3,
      presence_penalty: 0.1
    });

    // Extraction des critères de la réponse
    const text = response.choices[0].message.content;
    
    // Nettoyage rigoureux pour s'assurer que nous avons uniquement des noms, un par ligne
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        // Filtre pour éliminer les lignes vides, les lignes avec des puces, des numéros, ou des métacommentaires
        return line && 
               !line.match(/^(\d+\.|\-|\•|\*|\–|\—)/) && 
               !line.match(/^(Note|Pour|Voici|Cette|La liste|N\.B\.|P\.S\.|Remarque)/i) &&
               !line.match(/^(Here|Note|This list|The list|These are)/i);
      })
      .slice(0, maxResults);
  } catch (error) {
    console.error('Erreur lors de la génération des critères OpenAI:', error);
    throw new Error('Échec de la génération des critères: ' + (error.message || 'Erreur inconnue'));
  }
}

module.exports = {
  generateCriteria
};
