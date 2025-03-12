import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';

/**
 * Modal component for exporting data to Soprism
 * @param {boolean} show - Control modal visibility
 * @param {function} onHide - Function to hide modal
 * @param {array} results - Results data to export
 * @param {string} selectedCountry - Selected country code
 */
const SoprismExportModal = ({ show, onHide, results, selectedCountry }) => {
  // Form state
  const [universeName, setUniverseName] = useState('');
  const [countryRef, setCountryRef] = useState('');
  const [description, setDescription] = useState('');
  const [excludeDefault, setExcludeDefault] = useState(false);
  const [avoidDuplicates, setAvoidDuplicates] = useState(true);
  const [soprismCredentials, setSoprismCredentials] = useState({ username: '', password: '' });
  
  // Process states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [step, setStep] = useState(1); // 1: Config, 2: Authentication, 3: Processing
  
  // ISO 3166-2 country codes mapping
  const countryCodeMapping = {
    'BE': 'BE',
    'FR': 'FR',
    'CH': 'CH',
    'CA': 'CA',
    'US': 'US',
    'DE': 'DE',
    'ES': 'ES',
    'IT': 'IT',
    'GB': 'GB',
    // Add more countries as needed
  };
  
  // Initialize countryRef based on selectedCountry when modal opens
  useEffect(() => {
    if (selectedCountry && countryCodeMapping[selectedCountry]) {
      setCountryRef(countryCodeMapping[selectedCountry]);
    }
  }, [selectedCountry, show]);
  
  // Reset state when modal closes
  const handleClose = () => {
    setStep(1);
    setErrorMessage('');
    setIsLoading(false);
    onHide();
  };
  
  // Move to authentication step
  const handleContinue = () => {
    // Validate required fields
    if (!universeName.trim()) {
      setErrorMessage('Universe name is required');
      return;
    }
    
    if (!countryRef.trim()) {
      setErrorMessage('Country reference is required');
      return;
    }
    
    setErrorMessage('');
    setStep(2);
  };
  
  // Handle export to Soprism
  const handleExport = async () => {
    if (!soprismCredentials.username || !soprismCredentials.password) {
      setErrorMessage('Soprism credentials are required');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setStep(3);
    
    try {
      // 1. Authenticate with Soprism
      const authResponse = await axios.post('/api/soprism/authenticate', soprismCredentials);
      
      if (!authResponse.data.success || !authResponse.data.token) {
        throw new Error('Authentication failed');
      }
      
      const token = authResponse.data.token;
      
      // 2. Format data for Soprism export
      const exportData = {
        universeName,
        countryRef,
        description,
        excludeDefault,
        avoidDuplicates,
        results: formatResultsForSoprism(results)
      };
      
      // 3. Send export request
      const exportResponse = await axios.post('/api/soprism/export', 
        exportData,
        { 
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (exportResponse.data.success) {
        toast.success('Data successfully exported to Soprism!');
        handleClose();
      } else {
        throw new Error(exportResponse.data.message || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      setErrorMessage(error.message || 'Failed to export data to Soprism');
      setStep(2); // Go back to authentication step
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Format results data to match Soprism's expected structure
   * @param {array} results - Application results
   * @returns {array} - Formatted data for Soprism
   */
  const formatResultsForSoprism = (results) => {
    return results.map(result => {
      return {
        name: result.criterion,
        category: result.category || result.categoryPath || '',
        meta_id: result.bestMatch ? result.bestMatch.id : '',
        meta_name: result.bestMatch ? result.bestMatch.name : '',
        audience_size: result.bestMatch ? result.bestMatch.audience_size : 0
      };
    });
  };
  
  return (
    <Modal show={show} onHide={handleClose} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Export to Soprism</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {errorMessage && (
          <Alert variant="danger">{errorMessage}</Alert>
        )}
        
        {step === 1 && (
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Universe Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={universeName}
                onChange={(e) => setUniverseName(e.target.value)}
                placeholder="Enter universe name"
                required
              />
              <Form.Text>
                Name of the universe to create or update in Soprism
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Country Reference <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={countryRef}
                onChange={(e) => setCountryRef(e.target.value)}
                placeholder="ISO 3166-2 country code (e.g., FR, US)"
                maxLength={10}
                required
              />
              <Form.Text>
                ISO 3166-2 country code. Must be unique for each universe.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter universe description"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Exclude Default Universe"
                checked={excludeDefault}
                onChange={(e) => setExcludeDefault(e.target.checked)}
              />
              <Form.Text>
                When enabled, this universe will exclude the default universe in project creation
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Avoid Duplicates"
                checked={avoidDuplicates}
                onChange={(e) => setAvoidDuplicates(e.target.checked)}
              />
              <Form.Text>
                When enabled, criteria matching existing ones will be linked rather than duplicated
              </Form.Text>
            </Form.Group>
          </Form>
        )}
        
        {step === 2 && (
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Soprism Username <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={soprismCredentials.username}
                onChange={(e) => setSoprismCredentials({...soprismCredentials, username: e.target.value})}
                placeholder="Enter Soprism username"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Soprism Password <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="password"
                value={soprismCredentials.password}
                onChange={(e) => setSoprismCredentials({...soprismCredentials, password: e.target.value})}
                placeholder="Enter Soprism password"
                required
              />
            </Form.Group>
          </Form>
        )}
        
        {step === 3 && isLoading && (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Exporting data to Soprism...</p>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        
        {step === 1 && (
          <Button variant="primary" onClick={handleContinue}>
            Continue
          </Button>
        )}
        
        {step === 2 && (
          <Button variant="success" onClick={handleExport} disabled={isLoading}>
            {isLoading ? 'Exporting...' : 'Export to Soprism'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default SoprismExportModal;