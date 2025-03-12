const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

/**
 * @route GET /api/categories
 * @desc Get all categories
 * @access Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Ici, vous pourriez récupérer les catégories depuis une base de données
    // Pour l'instant, nous retournons une liste statique
    const categories = [
      { id: 1, name: 'Intérêts', slug: 'interests' },
      { id: 2, name: 'Comportements', slug: 'behaviors' },
      { id: 3, name: 'Démographie', slug: 'demographics' },
      { id: 4, name: 'Événements de vie', slug: 'life_events' }
    ];
    
    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router; 