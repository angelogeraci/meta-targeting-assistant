const axios = require('axios');
const ExcelJS = require('exceljs');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Default base URL
let SOPRISM_BASE_URL = process.env.SOPRISM_API_URL || 'https://api.soprism.com';

// API endpoints
const SOPRISM_AUTH_ENDPOINT = '/auth/token';
const SOPRISM_UPLOAD_ENDPOINT = '/universe/upload';
const SOPRISM_CREATE_UNIVERSE_ENDPOINT = '/universe/create';

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
        username: username || process.env.SOPRISM_USERNAME,
        password: password || process.env.SOPRISM_PASSWORD
      };

      // Validate credentials
      if (!credentials.username || !credentials.password) {
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
   * Generate Excel file from results and upload to Soprism
   * @param {Array} results - Formatted results
   * @param {string} token - Authentication token (optional if environment variables are set)
   * @returns {Promise<Object>} - Upload result
   */
  uploadSpreadsheet: async (results, token = null) => {
    try {
      // Get auth token if not provided
      const authToken = token || await soprismService.getAuthToken();
      
      // Create a temp file to store Excel data
      const tempFilePath = path.join(os.tmpdir(), `soprism_export_${Date.now()}.xlsx`);
      
      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Universe Import');
      
      // Add headers based on the corrected Soprism template format
      worksheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Category', key: 'category', width: 30 },
        { header: 'Meta ID', key: 'meta_id', width: 20 },
        { header: 'Audience Size', key: 'audience_size', width: 15 },
        { header: 'Meta Name', key: 'meta_name', width: 30 }
      ];
      
      // Add rows - format according to the new structure
      results.forEach(result => {
        const category = result.category || result.categoryPath || '';
        
        worksheet.addRow({
          name: result.name,
          category: category,
          meta_id: result.meta_id || '',
          audience_size: result.audience_size || 0,
          meta_name: result.meta_name || ''
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
      
      if (!uploadResponse.data || !uploadResponse.data.success) {
        throw new Error('File upload failed: ' + (uploadResponse.data?.message || 'Unknown error'));
      }
      
      return {
        success: true,
        fileName: path.basename(tempFilePath),
        fileId: uploadResponse.data.fileId
      };
    } catch (error) {
      console.error('Error uploading spreadsheet to Soprism:', error.response?.data || error.message);
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
      
      const response = await axios.post(
        `${SOPRISM_BASE_URL}${SOPRISM_CREATE_UNIVERSE_ENDPOINT}`,
        universeConfig,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      if (!response.data || !response.data.success) {
        throw new Error('Universe creation failed: ' + (response.data?.message || 'Unknown error'));
      }
      
      return {
        success: true,
        universeId: response.data.universeId,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error creating universe in Soprism:', error.response?.data || error.message);
      throw new Error('Universe creation failed: ' + (error.response?.data?.message || error.message));
    }
  }
};

module.exports = soprismService;