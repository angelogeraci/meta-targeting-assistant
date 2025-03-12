const express = require('express');
const router = express.Router();
const metaService = require('../services/meta');
const similarityService = require('../services/similarity');
const socketService = require('../services/socket');

/**
 * @route POST /api/meta/suggestions
 * @desc Get Meta interest suggestions for a criterion
 * @access Public
 */
router.post('/suggestions', async (req, res) => {
  try {
    const { criterion, country } = req.body;
    
    // Validation
    if (!criterion || !country) {
      return res.status(400).json({ 
        success: false, 
        message: 'Criterion and country are required' 
      });
    }
    
    // Convert country name to ISO code
    const countryCode = metaService.getCountryCode(country);
    
    // Get suggestions via Meta API
    const suggestions = await metaService.getTargetingSuggestions(criterion, countryCode);
    
    // Calculate similarity scores
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
    console.error('Error in /meta/suggestions route:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

/**
 * @route POST /api/meta/batch-suggestions
 * @desc Process a batch of criteria to get Meta suggestions
 * @access Public
 */
router.post('/batch-suggestions', async (req, res) => {
  try {
    const { criteria, country, similarityThreshold = 0.3 } = req.body;
    
    // Validation
    if (!criteria || !Array.isArray(criteria) || criteria.length === 0 || !country) {
      return res.status(400).json({ 
        success: false, 
        message: 'A list of criteria and a country are required' 
      });
    }
    
    // Convert country name to ISO code
    const countryCode = metaService.getCountryCode(country);
    
    // Process each criterion
    const results = [];
    const totalCriteria = criteria.length;
    
    // Send initial event via WebSocket
    socketService.emitProgress('meta-progress', {
      total: totalCriteria,
      current: 0,
      currentItem: null,
      status: 'starting'
    });
    
    for (let i = 0; i < totalCriteria; i++) {
      const criterion = criteria[i];
      
      try {
        // Update progress via WebSocket
        socketService.emitProgress('meta-progress', {
          total: totalCriteria,
          current: i,
          currentItem: criterion,
          status: 'processing'
        });
        
        // Get Meta suggestions
        const suggestions = await metaService.getTargetingSuggestions(criterion, countryCode);
        
        // Calculate similarity scores
        const matches = similarityService.findBestMatches(
          criterion, 
          suggestions, 
          parseFloat(similarityThreshold)
        );
        
        // Add results with original criterion
        results.push({
          original_criterion: criterion,
          matches,
          count: matches.length
        });
        
        // Update progress via WebSocket after each criterion is processed
        socketService.emitProgress('meta-progress', {
          total: totalCriteria,
          current: i + 1,
          currentItem: criterion,
          status: 'completed',
          matches: matches.length
        });
      } catch (error) {
        console.error(`Error processing criterion "${criterion}":`, error);
        
        results.push({
          original_criterion: criterion,
          matches: [],
          count: 0,
          error: error.message
        });
        
        // Signal the error via WebSocket
        socketService.emitProgress('meta-progress', {
          total: totalCriteria,
          current: i + 1,
          currentItem: criterion,
          status: 'error',
          error: error.message
        });
      }
    }
    
    // Traiter la file d'attente des audiences de taille 0
    socketService.emitProgress('meta-progress', {
      status: 'processing_zero_audience_queue',
      message: 'Retrying interests with zero audience size...'
    });
    
    const queueResults = await metaService.processZeroAudienceQueue();
    
    // Mettre à jour les résultats avec les nouvelles tailles d'audience
    if (queueResults.updated > 0) {
      queueResults.updatedInterests.forEach(updatedInterest => {
        // Trouver le critère correspondant
        const resultIndex = results.findIndex(r => r.original_criterion === updatedInterest.criterion);
        if (resultIndex !== -1) {
          // Mettre à jour la taille d'audience pour tous les matches correspondants
          results[resultIndex].matches.forEach(match => {
            if (match.id === updatedInterest.interestId) {
              match.country_audience_size = updatedInterest.audienceSize;
            }
          });
          
          // Mettre à jour le meilleur match si nécessaire
          const bestMatch = results[resultIndex].matches.find(m => m.id === updatedInterest.interestId);
          if (bestMatch && results[resultIndex].bestMatch && results[resultIndex].bestMatch.id === updatedInterest.interestId) {
            results[resultIndex].bestMatch.country_audience_size = updatedInterest.audienceSize;
          }
        }
      });
      
      // Informer via WebSocket
      socketService.emitProgress('meta-progress', {
        status: 'zero_audience_queue_processed',
        processed: queueResults.processed,
        updated: queueResults.updated
      });
    }
    
    // Send final event via WebSocket
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
      processed_criteria: results.length,
      zero_audience_queue_results: queueResults
    });
  } catch (error) {
    console.error('Error in /meta/batch-suggestions route:', error);
    
    // Signal global error via WebSocket
    socketService.emitProgress('meta-progress', {
      status: 'global-error',
      error: error.message || 'Server error'
    });
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

module.exports = router;
