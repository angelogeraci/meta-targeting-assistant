const axios = require('axios');
const ExcelJS = require('exceljs');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Constants
const SOPRISM_BASE_URL = process.env.SOPRISM_API_URL || 'https://api.soprism.com';
const SOPRISM_AUTH_ENDPOINT = '/auth/token';
const SOPRISM_UPLOAD_ENDPOINT = '/universe/upload';
const SOPRISM_CREATE_UNIVERSE_ENDPOINT = '/universe/create';

/**
 * Service for communicating with Soprism API
 */
const soprismService = {
  /**
   * Authenticate with Soprism API
   * @param {string} username - Soprism username
   * @param {string} password - Soprism password
   * @returns {Promise<Object>} - Authentication result with token
   */
  authenticate: async (username, password) => {
    try {
      const response = await axios.post(`${SOPRISM_BASE_URL}${SOPRISM_AUTH_ENDPOINT}`, {
        username,
        password
      });
      
      if (!response.data || !response.data.token) {
        throw new Error('Authentication failed: No token received');
      }
      
      return {
        token: response.data.token
      };
    } catch (error) {
      console.error('Error authenticating with Soprism:', error.response?.data || error.message);
      throw new Error('Authentication failed: ' + (error.response?.data?.message || error.message));
    }
  },
  
  /**
   * Generate Excel file from results and upload to Soprism
   * @param {Array} results - Formatted results
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} - Upload result
   */
  uploadSpreadsheet: async (results, token) => {
    try {
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
          name: result.criterion,
          category: category,
          meta_id: result.bestMatch ? result.bestMatch.id : '',
          audience_size: result.bestMatch ? result.bestMatch.audience_size : 0,
          meta_name: result.bestMatch ? result.bestMatch.name : ''
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
            'Authorization': `Bearer ${token}`
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
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} - Create/update result
   */
  createUniverse: async (universeConfig, token) => {
    try {
      const response = await axios.post(
        `${SOPRISM_BASE_URL}${SOPRISM_CREATE_UNIVERSE_ENDPOINT}`,
        universeConfig,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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