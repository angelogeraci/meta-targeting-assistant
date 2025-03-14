const axios = require('axios');
const ExcelJS = require('exceljs');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Default base URL
let SOPRISM_BASE_URL = process.env.SOPRISM_API_URL || 'https://core-dev.soprism.com';

// API endpoints
const SOPRISM_AUTH_ENDPOINT = '/auth';
const SOPRISM_UPLOAD_ENDPOINT = '/universes/upload/spreadsheet';
const SOPRISM_CREATE_UNIVERSE_ENDPOINT = '/universes';

// Cache for the auth token to avoid multiple auth requests in a short time
let cachedToken = null;
let tokenExpirationTime = null;
const TOKEN_VALIDITY_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Service for communicating with Soprism API
 */
const soprismService = {
  /**
   * Set the API base URL
   * @param {string} url - New base URL for the API
   */
  setApiUrl: (url) => {
    if (url) {
      SOPRISM_BASE_URL = url;
    }
  },

  /**
   * Get authentication token from Soprism
   * @param {string} username - Soprism username (optional if environment variables are set)
   * @param {string} password - Soprism password (optional if environment variables are set)
   * @returns {Promise<string>} - Authentication token
   */
  getAuthToken: async (username, password) => {
    try {
      // Check if we have a valid cached token
      const now = Date.now();
      if (cachedToken && tokenExpirationTime && now < tokenExpirationTime) {
        return cachedToken;
      }

      // Use provided credentials or fall back to environment variables
      const credentials = {
        email: username || process.env.SOPRISM_USERNAME,
        password: password || process.env.SOPRISM_PASSWORD
      };

      // Validate credentials
      if (!credentials.email || !credentials.password) {
        throw new Error('Soprism credentials are required. Set SOPRISM_USERNAME and SOPRISM_PASSWORD in environment variables.');
      }

      // Make authentication request
      const response = await axios.post(`${SOPRISM_BASE_URL}${SOPRISM_AUTH_ENDPOINT}`, credentials);

      if (!response.data || !response.data.token) {
        throw new Error('Authentication failed: No token received');
      }

      // Cache the token
      cachedToken = response.data.token;
      tokenExpirationTime = now + TOKEN_VALIDITY_DURATION;

      return cachedToken;
    } catch (error) {
      console.error('Error authenticating with Soprism:', error.response?.data || error.message);
      throw new Error('Authentication failed: ' + (error.response?.data?.message || error.message));
    }
  },
  
  /**
   * Generate Excel file from results without uploading to Soprism
   * @param {Array} results - Formatted results
   * @returns {Promise<Buffer>} - Excel file buffer
   */
  generateExcelFile: async (results) => {
    try {
      // Create Excel workbook in memory
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Universe Import');
      
      // Add headers based on the Soprism template format
      worksheet.columns = [
        { header: 'Path', key: 'path', width: 60 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Category', key: 'category', width: 30 },
        { header: 'Exclusions', key: 'exclusions', width: 15 },
        { header: 'Level 1', key: 'level1', width: 30 }
      ];
      
      // Add rows - format according to the structure
      results.forEach(result => {
        const category = result.category || result.categoryPath || '';
        const name = result.name || result.criterion || '';
        const path = result.fullPath || `Brands relationship -- ${category} -- ${name}`;
        
        worksheet.addRow({
          path: path,
          name: name,
          category: category,
          exclusions: '', // Colonne vide pour le moment
          level1: name // Level 1 correspond à l'intérêt (même valeur que Name)
        });
      });
      
      // Generate buffer
      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      console.error('Error generating Excel file:', error);
      throw new Error('Excel file generation failed: ' + error.message);
    }
  },
  
  /**
   * Generate Excel file from results and upload to Soprism
   * @param {Array} results - Formatted results
   * @param {string} token - Authentication token (optional if environment variables are set)
   * @returns {Promise<Object>} - Upload result
   */
  uploadSpreadsheet: async (results, token = null) => {
    // Déclarer tempFilePath en dehors du bloc try
    let tempFilePath;
    
    try {
      // Get auth token if not provided
      const authToken = token || await soprismService.getAuthToken();
      
      // Create a temp file to store Excel data
      tempFilePath = path.join(os.tmpdir(), `soprism_export_${Date.now()}.xlsx`);
      
      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Universe Import');
      
      // Add headers based on the corrected Soprism template format
      worksheet.columns = [
        { header: 'Path', key: 'path', width: 60 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Category', key: 'category', width: 30 },
        { header: 'Exclusions', key: 'exclusions', width: 15 },
        { header: 'Level 1', key: 'level1', width: 30 }
      ];
      
      // Add rows - format according to the new structure
      results.forEach(result => {
        const category = result.category || result.categoryPath || '';
        const name = result.name || result.criterion || '';
        const path = result.fullPath || `Brands relationship -- ${category} -- ${name}`;
        
        worksheet.addRow({
          path: path,
          name: name,
          category: category,
          exclusions: '', // Colonne vide pour le moment
          level1: name // Level 1 correspond à l'intérêt (même valeur que Name)
        });
      });
      
      // Write to temp file
      await workbook.xlsx.writeFile(tempFilePath);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', fs.createReadStream(tempFilePath));
      
      // Upload file to Soprism
      const uploadResponse = await axios.post(
        `${SOPRISM_BASE_URL}${SOPRISM_UPLOAD_ENDPOINT}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
      
      // Si la réponse contient "File uploaded", c'est un succès
      if (uploadResponse.data === "File uploaded" || (uploadResponse.data && uploadResponse.data.success)) {
        return {
          success: true,
          fileName: path.basename(tempFilePath),
          fileId: uploadResponse.data.fileId || null // fileId peut être absent dans le cas de "File uploaded"
        };
      }
      
      if (!uploadResponse.data) {
        throw new Error('File upload failed: Unknown error');
      }
      
      throw new Error('File upload failed: ' + (uploadResponse.data.message || 'Unknown error'));
    } catch (error) {
      console.error('Error uploading spreadsheet to Soprism:', error.response?.data || error.message);
      
      // Si la réponse contient "File uploaded", c'est un succès malgré l'erreur
      if (error.response?.data === "File uploaded" || 
          error.message.includes("File uploaded") || 
          (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes("File uploaded"))) {
        console.log("Detected 'File uploaded' in error response, treating as success");
        return {
          success: true,
          fileName: path.basename(tempFilePath || `soprism_export_${Date.now()}.xlsx`),
          fileId: null
        };
      }
      
      throw new Error('Spreadsheet upload failed: ' + (error.response?.data?.message || error.message));
    }
  },
  
  /**
   * Create or update a universe in Soprism
   * @param {Object} universeConfig - Universe configuration
   * @param {string} token - Authentication token (optional if environment variables are set)
   * @returns {Promise<Object>} - Create/update result
   */
  createUniverse: async (universeConfig, token = null) => {
    try {
      // Get auth token if not provided
      const authToken = token || await soprismService.getAuthToken();
      
      console.log('Creating universe with config:', JSON.stringify(universeConfig));
      console.log('Endpoint:', `${SOPRISM_BASE_URL}${SOPRISM_CREATE_UNIVERSE_ENDPOINT}`);
      
      // Assurons-nous que les paramètres sont au bon format
      const formattedConfig = {
        file_name: universeConfig.file_name,
        name: universeConfig.name,
        country_ref: universeConfig.country_ref,
        description: universeConfig.description,
        exclude_default: universeConfig.exclude_default === true,
        avoid_duplicates: universeConfig.avoid_duplicates === true
      };
      
      console.log('Formatted config for Soprism API:', formattedConfig);
      
      const response = await axios.post(
        `${SOPRISM_BASE_URL}${SOPRISM_CREATE_UNIVERSE_ENDPOINT}`,
        formattedConfig,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      console.log('Universe creation response:', JSON.stringify(response.data));
      
      // Gérer différents formats de réponse possibles
      if (response.data) {
        if (response.data.success === false) {
          throw new Error('Universe creation failed: ' + (response.data.message || 'API reported failure'));
        }
        
        // Si nous avons un ID d'univers ou un message de succès, considérons que c'est un succès
        if (response.data.id || response.data.universeId || response.data.success === true || 
            (response.data.message && response.data.message.toLowerCase().includes('success'))) {
          return {
            success: true,
            universeId: response.data.id || response.data.universeId || null,
            message: response.data.message || 'Universe created successfully'
          };
        }
      }
      
      // Si nous arrivons ici, la réponse n'est pas dans un format attendu
      console.warn('Unexpected response format from universe creation:', response.data);
      return {
        success: true,
        universeId: null,
        message: 'Universe may have been created, but response format was unexpected'
      };
    } catch (error) {
      console.error('Error creating universe in Soprism:', error.response?.data || error.message);
      console.error('Full error object:', JSON.stringify(error.response || error, null, 2));
      throw new Error('Universe creation failed: ' + (error.response?.data?.message || error.message));
    }
  }
};

module.exports = soprismService;