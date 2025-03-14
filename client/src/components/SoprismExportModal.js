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
  
  // Advanced settings
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [useCustomCredentials, setUseCustomCredentials] = useState(false);
  
  // Process states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // ISO 3166-2 country codes mapping - tous les pays utilisent leur code ISO comme référence
  const countryCodeMapping = {
    'AF': 'AF', 'AL': 'AL', 'DZ': 'DZ', 'AS': 'AS', 'AD': 'AD', 'AO': 'AO', 'AI': 'AI', 'AQ': 'AQ', 'AG': 'AG', 
    'AR': 'AR', 'AM': 'AM', 'AW': 'AW', 'AU': 'AU', 'AT': 'AT', 'AZ': 'AZ', 'BS': 'BS', 'BH': 'BH', 'BD': 'BD', 
    'BB': 'BB', 'BY': 'BY', 'BE': 'BE', 'BZ': 'BZ', 'BJ': 'BJ', 'BM': 'BM', 'BT': 'BT', 'BO': 'BO', 'BA': 'BA', 
    'BW': 'BW', 'BV': 'BV', 'BR': 'BR', 'IO': 'IO', 'BN': 'BN', 'BG': 'BG', 'BF': 'BF', 'BI': 'BI', 'KH': 'KH', 
    'CM': 'CM', 'CA': 'CA', 'CV': 'CV', 'KY': 'KY', 'CF': 'CF', 'TD': 'TD', 'CL': 'CL', 'CN': 'CN', 'CX': 'CX', 
    'CC': 'CC', 'CO': 'CO', 'KM': 'KM', 'CG': 'CG', 'CD': 'CD', 'CK': 'CK', 'CR': 'CR', 'CI': 'CI', 'HR': 'HR', 
    'CU': 'CU', 'CY': 'CY', 'CZ': 'CZ', 'DK': 'DK', 'DJ': 'DJ', 'DM': 'DM', 'DO': 'DO', 'EC': 'EC', 'EG': 'EG', 
    'SV': 'SV', 'GQ': 'GQ', 'ER': 'ER', 'EE': 'EE', 'ET': 'ET', 'FK': 'FK', 'FO': 'FO', 'FJ': 'FJ', 'FI': 'FI', 
    'FR': 'FR', 'GF': 'GF', 'PF': 'PF', 'TF': 'TF', 'GA': 'GA', 'GM': 'GM', 'GE': 'GE', 'DE': 'DE', 'GH': 'GH', 
    'GI': 'GI', 'GR': 'GR', 'GL': 'GL', 'GD': 'GD', 'GP': 'GP', 'GU': 'GU', 'GT': 'GT', 'GN': 'GN', 'GW': 'GW', 
    'GY': 'GY', 'HT': 'HT', 'HM': 'HM', 'VA': 'VA', 'HN': 'HN', 'HK': 'HK', 'HU': 'HU', 'IS': 'IS', 'IN': 'IN', 
    'ID': 'ID', 'IR': 'IR', 'IQ': 'IQ', 'IE': 'IE', 'IL': 'IL', 'IT': 'IT', 'JM': 'JM', 'JP': 'JP', 'JO': 'JO', 
    'KZ': 'KZ', 'KE': 'KE', 'KI': 'KI', 'KP': 'KP', 'KR': 'KR', 'KW': 'KW', 'KG': 'KG', 'LA': 'LA', 'LV': 'LV', 
    'LB': 'LB', 'LS': 'LS', 'LR': 'LR', 'LY': 'LY', 'LI': 'LI', 'LT': 'LT', 'LU': 'LU', 'MO': 'MO', 'MK': 'MK', 
    'MG': 'MG', 'MW': 'MW', 'MY': 'MY', 'MV': 'MV', 'ML': 'ML', 'MT': 'MT', 'MH': 'MH', 'MQ': 'MQ', 'MR': 'MR', 
    'MU': 'MU', 'YT': 'YT', 'MX': 'MX', 'FM': 'FM', 'MD': 'MD', 'MC': 'MC', 'MN': 'MN', 'MS': 'MS', 'MA': 'MA', 
    'MZ': 'MZ', 'MM': 'MM', 'NA': 'NA', 'NR': 'NR', 'NP': 'NP', 'NL': 'NL', 'NC': 'NC', 'NZ': 'NZ', 'NI': 'NI', 
    'NE': 'NE', 'NG': 'NG', 'NU': 'NU', 'NF': 'NF', 'MP': 'MP', 'NO': 'NO', 'OM': 'OM', 'PK': 'PK', 'PW': 'PW', 
    'PS': 'PS', 'PA': 'PA', 'PG': 'PG', 'PY': 'PY', 'PE': 'PE', 'PH': 'PH', 'PN': 'PN', 'PL': 'PL', 'PT': 'PT', 
    'PR': 'PR', 'QA': 'QA', 'RE': 'RE', 'RO': 'RO', 'RU': 'RU', 'RW': 'RW', 'SH': 'SH', 'KN': 'KN', 'LC': 'LC', 
    'PM': 'PM', 'VC': 'VC', 'WS': 'WS', 'SM': 'SM', 'ST': 'ST', 'SA': 'SA', 'SN': 'SN', 'RS': 'RS', 'SC': 'SC', 
    'SL': 'SL', 'SG': 'SG', 'SK': 'SK', 'SI': 'SI', 'SB': 'SB', 'SO': 'SO', 'ZA': 'ZA', 'GS': 'GS', 'ES': 'ES', 
    'LK': 'LK', 'SD': 'SD', 'SR': 'SR', 'SJ': 'SJ', 'SZ': 'SZ', 'SE': 'SE', 'CH': 'CH', 'SY': 'SY', 'TW': 'TW', 
    'TJ': 'TJ', 'TZ': 'TZ', 'TH': 'TH', 'TL': 'TL', 'TG': 'TG', 'TK': 'TK', 'TO': 'TO', 'TT': 'TT', 'TN': 'TN', 
    'TR': 'TR', 'TM': 'TM', 'TC': 'TC', 'TV': 'TV', 'UG': 'UG', 'UA': 'UA', 'AE': 'AE', 'GB': 'GB', 'US': 'US', 
    'UM': 'UM', 'UY': 'UY', 'UZ': 'UZ', 'VU': 'VU', 'VE': 'VE', 'VN': 'VN', 'VG': 'VG', 'VI': 'VI', 'WF': 'WF', 
    'EH': 'EH', 'YE': 'YE', 'ZM': 'ZM', 'ZW': 'ZW'
  };
  
  // Initialize countryRef based on selectedCountry when modal opens
  useEffect(() => {
    if (show) {
      // Réinitialiser les champs du formulaire
      setUniverseName(`MTA Universe ${new Date().toLocaleDateString()}`);
      setDescription(`Meta Targeting Assistant Universe - ${new Date().toLocaleDateString()}`);
      
      // Définir le code pays de référence
      if (selectedCountry && countryCodeMapping[selectedCountry]) {
        setCountryRef(countryCodeMapping[selectedCountry]);
      }
    }
  }, [selectedCountry, show]);
  
  // Reset state when modal closes
  const handleClose = () => {
    setErrorMessage('');
    setIsLoading(false);
    onHide();
  };
  
  // Handle export to Soprism
  const handleExport = async () => {
    // Validate required fields
    if (!universeName.trim()) {
      setErrorMessage('Le nom de l\'univers est requis');
      return;
    }
    
    if (!countryRef.trim()) {
      setErrorMessage('La référence du pays est requise');
      return;
    }
    
    if (useCustomCredentials && (!username.trim() || !password.trim())) {
      setErrorMessage('Le nom d\'utilisateur et le mot de passe sont requis lorsque vous utilisez des identifiants personnalisés');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Format data for Soprism export
      const exportData = {
        universeName,
        countryRef,
        description,
        excludeDefault: excludeDefault === true,
        avoidDuplicates: avoidDuplicates === true,
        results: formatResultsForSoprism(results)
      };
      
      console.log('Sending export data with options:', {
        excludeDefault: excludeDefault === true,
        avoidDuplicates: avoidDuplicates === true
      });
      
      // Add custom credentials if specified
      if (useCustomCredentials) {
        exportData.username = username;
        exportData.password = password;
      }
      
      // Add custom API URL if specified
      if (apiUrl.trim()) {
        exportData.apiUrl = apiUrl;
      }
      
      // Send export request
      const exportResponse = await axios.post('/api/soprism/export', exportData);
      
      if (exportResponse.data.success) {
        toast.success('Données exportées avec succès vers Soprism !');
        handleClose();
      } else {
        throw new Error(exportResponse.data.message || 'Échec de l\'exportation');
      }
    } catch (error) {
      console.error('Erreur d\'exportation:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Échec de l\'exportation des données vers Soprism');
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
      const name = result.criterion;
      const category = result.category || result.categoryPath || '';
      const path = result.fullPath || `Brands relationship -- ${category} -- ${name}`;
      
      return {
        path: path,
        name: name,
        category: category,
        exclusions: '', // Colonne vide pour le moment
        level1: name // Level 1 correspond à l'intérêt (même valeur que Name)
      };
    });
  };
  
  return (
    <Modal show={show} onHide={handleClose} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Exporter vers Soprism</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {errorMessage && (
          <Alert variant="danger">{errorMessage}</Alert>
        )}
        
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Nom de l'univers <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              value={universeName}
              onChange={(e) => setUniverseName(e.target.value)}
              placeholder="Entrez le nom de l'univers"
              required
              disabled={isLoading}
            />
            <Form.Text>
              Nom de l'univers à créer ou mettre à jour dans Soprism
            </Form.Text>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Référence du pays <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              value={countryRef}
              onChange={(e) => setCountryRef(e.target.value)}
              placeholder="Code pays ISO 3166-2 (ex: FR, US)"
              maxLength={10}
              required
              disabled={isLoading}
            />
            <Form.Text>
              Code pays ISO 3166-2. Doit être unique pour chaque univers.
            </Form.Text>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Entrez la description de l'univers"
              disabled={isLoading}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Exclure l'univers par défaut"
              checked={excludeDefault}
              onChange={(e) => setExcludeDefault(e.target.checked)}
              disabled={isLoading}
            />
            <Form.Text>
              Si coché, l'univers par défaut sera exclu lors de la création de l'univers.
            </Form.Text>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Éviter les doublons"
              checked={avoidDuplicates}
              onChange={(e) => setAvoidDuplicates(e.target.checked)}
              disabled={isLoading}
            />
            <Form.Text>
              Si coché, les doublons seront évités lors de la création de l'univers.
            </Form.Text>
          </Form.Group>
          
          <div className="mb-3">
            <Button
              variant="link"
              className="p-0"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              disabled={isLoading}
            >
              {showAdvancedSettings ? 'Masquer les paramètres avancés' : 'Afficher les paramètres avancés'}
            </Button>
          </div>
          
          {showAdvancedSettings && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>URL de l'API Soprism</Form.Label>
                <Form.Control
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://core-dev.soprism.com"
                  disabled={isLoading}
                />
                <Form.Text>
                  Laissez vide pour utiliser l'URL par défaut définie dans les variables d'environnement.
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Utiliser des identifiants personnalisés"
                  checked={useCustomCredentials}
                  onChange={(e) => setUseCustomCredentials(e.target.checked)}
                  disabled={isLoading}
                />
              </Form.Group>
              
              {useCustomCredentials && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Nom d'utilisateur Soprism</Form.Label>
                    <Form.Control
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Entrez votre nom d'utilisateur Soprism"
                      disabled={isLoading}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Mot de passe Soprism</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Entrez votre mot de passe Soprism"
                      disabled={isLoading}
                    />
                  </Form.Group>
                </>
              )}
            </>
          )}
        </Form>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleExport} disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Exportation...
            </>
          ) : (
            'Exporter vers Soprism'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SoprismExportModal;