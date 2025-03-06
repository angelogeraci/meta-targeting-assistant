const express = require('express');
const router = express.Router();
const openaiService = require('../services/openai');

/**
 * @route GET /api/criteria/generate
 * @desc Génère des critères pour une catégorie dans un pays spécifique
 * @access Public
 */
router.get('/generate', async (req, res) => {
  try {
    const { category, country, maxResults } = req.query;
    
    // Validation des paramètres
    if (!category || !country) {
      return res.status(400).json({ 
        success: false, 
        message: 'Les paramètres category et country sont requis' 
      });
    }
    
    // Génération des critères via OpenAI
    const criteria = await openaiService.generateCriteria(
      category, 
      country, 
      maxResults ? parseInt(maxResults) : 50
    );
    
    res.json({
      success: true,
      data: criteria,
      count: criteria.length,
      category,
      country
    });
  } catch (error) {
    console.error('Erreur dans la route /criteria/generate:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erreur serveur' 
    });
  }
});

/**
 * @route GET /api/criteria/categories
 * @desc Récupère les catégories disponibles
 * @access Public
 */
router.get('/categories', (req, res) => {
  // Ces catégories pourraient être stockées dans une base de données ou un fichier de configuration
  const categories = [
    { id: 'automobiles', name: 'Automobiles' },
    { id: 'chanteurs', name: 'Chanteurs' },
    { id: 'restaurants', name: 'Restaurants' },
    { id: 'marques_vetements', name: 'Marques de vêtements' },
    { id: 'sports', name: 'Sports' },
    { id: 'acteurs', name: 'Acteurs' },
    { id: 'loisirs', name: 'Loisirs' },
    { id: 'technologie', name: 'Technologie' }
  ];
  
  res.json({
    success: true,
    data: categories
  });
});

/**
 * @route GET /api/criteria/countries
 * @desc Récupère les pays disponibles
 * @access Public
 */
router.get('/countries', (req, res) => {
  // Liste de pays qui pourrait être étendue
  const countries = [
    { code: 'BE', name: 'Belgique' },
    { code: 'FR', name: 'France' },
    { code: 'CH', name: 'Suisse' },
    { code: 'CA', name: 'Canada' },
    { code: 'US', name: 'États-Unis' },
    { code: 'DE', name: 'Allemagne' },
    { code: 'ES', name: 'Espagne' },
    { code: 'IT', name: 'Italie' },
    { code: 'GB', name: 'Royaume-Uni' }
  ];
  
  res.json({
    success: true,
    data: countries
  });
});

module.exports = router;
