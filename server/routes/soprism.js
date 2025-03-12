const express = require('express');
const router = express.Router();
const soprismService = require('../services/soprism');
const auth = require('../middleware/auth');

/**
 * @route POST /api/soprism/export
 * @desc Export data to Soprism
 * @access Private
 */
router.post('/export', auth, async (req, res) => {
  try {
    const { 
      universeName, 
      countryRef, 
      description, 
      excludeDefault, 
      avoidDuplicates,
      apiToken,
      apiUrl,
      results 
    } = req.body;
    
    // Validate required parameters
    if (!universeName || !countryRef) {
      return res.status(400).json({
        success: false,
        message: 'Universe name and country reference are required'
      });
    }
    
    if (!apiToken) {
      return res.status(400).json({
        success: false,
        message: 'Soprism API token is required'
      });
    }
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No results to export'
      });
    }
    
    // Set API URL if provided
    if (apiUrl) {
      soprismService.setApiUrl(apiUrl);
    }
    
    // Step 1: Generate and upload Excel file
    const fileUploadResult = await soprismService.uploadSpreadsheet(results, apiToken);
    
    if (!fileUploadResult.success) {
      throw new Error('Failed to upload spreadsheet: ' + fileUploadResult.message);
    }
    
    // Step 2: Create/fill universe with uploaded file
    const createUniverseResult = await soprismService.createUniverse({
      file_name: fileUploadResult.fileName,
      name: universeName,
      country_ref: countryRef,
      description: description || `Universe created from Meta Targeting Assistant on ${new Date().toLocaleDateString()}`,
      exclude_default: excludeDefault || false,
      avoid_duplicates: avoidDuplicates !== false, // Default to true if not specified
    }, apiToken);
    
    res.json({
      success: true,
      message: 'Data successfully exported to Soprism',
      universeName,
      exportedCount: results.length,
      universeId: createUniverseResult.universeId
    });
  } catch (error) {
    console.error('Soprism export error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Export failed'
    });
  }
});

module.exports = router;