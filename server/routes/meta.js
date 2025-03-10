const express = require('express');
const router = express.Router();
const metaService = require('../services/meta');
const similarityService = require('../services/similarity');
const socketService = require('../services/socket');

/**
 * @route POST /api/meta/suggestions
 * @desc Récupère des suggestions d'intérêts Meta pour un critère
 * @access Public
 */
router.post('/suggestions', async (req, res) => {
  try {
    const { criterion, country } = req.body;
    
    // Validation
    if (!criterion || !country) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le critère et le pays sont requis' 
      });
    }
    
    // Conversion du nom de pays en code ISO
    const countryCode = metaService.getCountryCode(country);
    
    // Récupération des suggestions via l'API Meta
    const suggestions = await metaService.getTargetingSuggestions(criterion, countryCode);
    
    // Calcul des scores de similarité
    const results = similarityService.findBestMatches(criterion, suggestions);
    
    res.json({
      success: true,
      criterion,
      country,
      countryCode,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('Erreur dans la route /meta/suggestions:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erreur serveur' 
    });
  }
});

/**
 * @route POST /api/meta/batch-suggestions
 * @desc Traite un lot de critères pour obtenir des suggestions Meta
 * @access Public
 */
router.post('/batch-suggestions', async (req, res) => {
  try {
    const { criteria, country, similarityThreshold = 0.3 } = req.body;
    
    // Validation
    if (!criteria || !Array.isArray(criteria) || criteria.length === 0 || !country) {
      return res.status(400).json({ 
        success: false, 
        message: 'Une liste de critères et un pays sont requis' 
      });
    }
    
    // Conversion du nom de pays en code ISO
    const countryCode = metaService.getCountryCode(country);
    
    // Traitement de chaque critère
    const results = [];
    const totalCriteria = criteria.length;
    
    // Envoi de l'événement initial via WebSocket
    socketService.emitProgress('meta-progress', {
      total: totalCriteria,
      current: 0,
      currentItem: null,
      status: 'starting'
    });
    
    for (let i = 0; i < totalCriteria; i++) {
      const criterion = criteria[i];
      
      try {
        // Mise à jour de la progression via WebSocket
        socketService.emitProgress('meta-progress', {
          total: totalCriteria,
          current: i,
          currentItem: criterion,
          status: 'processing'
        });
        
        // Récupération des suggestions Meta
        const suggestions = await metaService.getTargetingSuggestions(criterion, countryCode);
        
        // Calcul des scores de similarité
        const matches = similarityService.findBestMatches(
          criterion, 
          suggestions, 
          parseFloat(similarityThreshold)
        );
        
        // Ajout des résultats avec le critère original
        results.push({
          original_criterion: criterion,
          matches,
          count: matches.length
        });
        
        // Mise à jour de la progression via WebSocket après chaque critère traité
        socketService.emitProgress('meta-progress', {
          total: totalCriteria,
          current: i + 1,
          currentItem: criterion,
          status: 'completed',
          matches: matches.length
        });
      } catch (error) {
        console.error(`Erreur lors du traitement du critère "${criterion}":`, error);
        
        results.push({
          original_criterion: criterion,
          matches: [],
          count: 0,
          error: error.message
        });
        
        // Signaler l'erreur via WebSocket
        socketService.emitProgress('meta-progress', {
          total: totalCriteria,
          current: i + 1,
          currentItem: criterion,
          status: 'error',
          error: error.message
        });
      }
    }
    
    // Envoi de l'événement final via WebSocket
    socketService.emitProgress('meta-progress', {
      total: totalCriteria,
      current: totalCriteria,
      status: 'finished'
    });
    
    res.json({
      success: true,
      country,
      countryCode,
      data: results,
      total_criteria: criteria.length,
      processed_criteria: results.length
    });
  } catch (error) {
    console.error('Erreur dans la route /meta/batch-suggestions:', error);
    
    // Signaler l'erreur globale via WebSocket
    socketService.emitProgress('meta-progress', {
      status: 'global-error',
      error: error.message || 'Erreur serveur'
    });
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erreur serveur' 
    });
  }
});

module.exports = router;
