const express = require('express');
const router = express.Router();
const openaiService = require('../services/openai');

/**
 * @route GET /api/criteria/generate
 * @desc Generate criteria for a category in a specific country
 * @access Public
 */
router.get('/generate', async (req, res) => {
  try {
    const { category, country, maxResults } = req.query;
    
    // Parameter validation
    if (!category || !country) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category and country parameters are required' 
      });
    }
    
    // Generate criteria via OpenAI
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
    console.error('Error in /criteria/generate route:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

/**
 * @route GET /api/criteria/categories
 * @desc Retrieve available categories
 * @access Public
 */
router.get('/categories', (req, res) => {
  // These categories could be stored in a database or configuration file
  const categories = [
    { id: 'automobiles', name: 'Automobiles' },
    { id: 'singers', name: 'Singers' },
    { id: 'restaurants', name: 'Restaurants' },
    { id: 'clothing_brands', name: 'Clothing Brands' },
    { id: 'sports', name: 'Sports' },
    { id: 'actors', name: 'Actors' },
    { id: 'hobbies', name: 'Hobbies' },
    { id: 'technology', name: 'Technology' }
  ];
  
  res.json({
    success: true,
    data: categories
  });
});

/**
 * @route GET /api/criteria/countries
 * @desc Retrieve available countries
 * @access Public
 */
router.get('/countries', (req, res) => {
  // List of countries that could be extended
  const countries = [
    { code: 'BE', name: 'Belgium' },
    { code: 'FR', name: 'France' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'CA', name: 'Canada' },
    { code: 'US', name: 'United States' },
    { code: 'DE', name: 'Germany' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'GB', name: 'United Kingdom' }
  ];
  
  res.json({
    success: true,
    data: countries
  });
});

module.exports = router;
