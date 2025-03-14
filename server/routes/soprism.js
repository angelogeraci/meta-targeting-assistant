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
      apiUrl,
      username,
      password,
      results 
    } = req.body;
    
    // Validate required parameters
    if (!universeName || !countryRef) {
      return res.status(400).json({
        success: false,
        message: 'Universe name and country reference are required'
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
    
    // Try to get authentication token
    let token = null;
    try {
      token = await soprismService.getAuthToken(username, password);
    } catch (authError) {
      return res.status(401).json({
        success: false,
        message: authError.message
      });
    }
    
    // Step 1: Generate and upload Excel file
    let fileUploadResult;
    try {
      fileUploadResult = await soprismService.uploadSpreadsheet(results, token);
    } catch (error) {
      // Si l'erreur contient "File uploaded", c'est en fait un succès
      if (error.message && error.message.includes("File uploaded")) {
        console.log("Intercepting 'File uploaded' error and treating it as success");
        fileUploadResult = {
          success: true,
          fileName: `soprism_export_${Date.now()}.xlsx`,
          fileId: null
        };
      } else {
        // Propager les autres erreurs
        console.error("Spreadsheet upload error:", error.message);
        throw error;
      }
    }
    
    if (!fileUploadResult.success) {
      throw new Error('Failed to upload spreadsheet: ' + fileUploadResult.message);
    }
    
    // Step 2: Create/fill universe with uploaded file
    const createUniverseResult = await soprismService.createUniverse({
      file_name: fileUploadResult.fileName,
      name: universeName,
      country_ref: countryRef,
      description: description || `MTA Universe ${new Date().toLocaleDateString()}`,
      exclude_default: excludeDefault === true,
      avoid_duplicates: avoidDuplicates === true
    }, token);
    
    console.log('Universe creation parameters:', {
      fileName: fileUploadResult.fileName,
      name: universeName,
      country_ref: countryRef,
      exclude_default: excludeDefault === true,
      avoid_duplicates: avoidDuplicates === true
    });
    
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

/**
 * @route POST /api/soprism/export-xls
 * @desc Export data to XLS file with Soprism structure
 * @access Private
 */
router.post('/export-xls', auth, async (req, res) => {
  try {
    const { results } = req.body;
    
    // Validate required parameters
    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No results to export'
      });
    }
    
    // Generate Excel file in memory
    const excelBuffer = await soprismService.generateExcelFile(results);
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=soprism_export_${Date.now()}.xlsx`);
    
    // Send the buffer as response
    res.send(excelBuffer);
  } catch (error) {
    console.error('XLS export error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Export failed'
    });
  }
});

module.exports = router;