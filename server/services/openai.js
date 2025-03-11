const { OpenAI } = require('openai');

// Create OpenAI instance with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate criteria for a specific category and country
 * @param {string} category - Category (e.g., "automobiles", "singers")
 * @param {string} country - Country (e.g., "Belgium", "France")
 * @param {number} maxResults - Maximum number of criteria to generate
 * @returns {Promise<string[]>} - List of generated criteria
 */
async function generateCriteria(category, country, maxResults = 500) {
  try {
    const systemPrompt = `
    You are a digital marketing expert specialized in generating precise targeting criteria for advertisements.
    
    TASK:
    Generate an exceptionally long list of specific names within the requested category that are relevant to the specified country.
    
    STRICT RULES:
    1. RETURN ONLY precise names, one per line, without numbering, enumeration, prefixes, or explanations.
    2. Never respond with sentences or explanations, just names.
    3. DO NOT add general categories or subcategories.
    4. DO NOT include ANY explanatory text, not even at the beginning or end.
    5. Each line must contain EXACTLY ONE specific name and nothing else.
    6. Never use quotation marks, hyphens, or other decorative characters.
    7. NEVER say that you cannot be exhaustive.
    
    SPECIFIC INSTRUCTIONS:
    - Criteria should include both local/national elements from ${country} AND foreign elements popular in that country.
    - Provide the maximum possible number of specific names, aim for at least ${maxResults} items.
    - Ensure each name is known and relevant in ${country}.
    - Cover all demographic segments (youth, adults, seniors).
    `;

    const userPrompt = `
    Generate an EXHAUSTIVE list of at least ${maxResults} popular or well-known ${category} in ${country}.
    
    IMPORTANT:
    - RETURN ONLY THE LIST OF SPECIFIC NAMES, ONE PER LINE.
    - DO NOT GIVE AN INTRODUCTION OR CONCLUSION.
    - DO NOT SAY THAT THE LIST IS NOT EXHAUSTIVE.
    - DO NOT USE NUMBERS, BULLETS, OR CATEGORIES.
    - DO NOT ADD ANY EXPLANATORY TEXT.
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

    // Extract criteria from the response
    const text = response.choices[0].message.content;
    
    // Rigorous cleaning to ensure we only have names, one per line
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        // Filter to eliminate empty lines, lines with bullets, numbers, or meta-comments
        return line && 
               !line.match(/^(\d+\.|\-|\•|\*|\–|\—)/) && 
               !line.match(/^(Note|Pour|Voici|Cette|La liste|N\.B\.|P\.S\.|Remarque)/i) &&
               !line.match(/^(Here|Note|This list|The list|These are)/i);
      })
      .slice(0, maxResults);
  } catch (error) {
    console.error('Error generating OpenAI criteria:', error);
    throw new Error('Failed to generate criteria: ' + (error.message || 'Unknown error'));
  }
}

module.exports = {
  generateCriteria
};
