import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Alert, Button } from 'react-bootstrap';
import { FaChartLine, FaSearchLocation, FaLayerGroup, FaDatabase, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import CountrySelector from '../components/CountrySelector';
import CategorySelector from '../components/CategorySelector';
import ResultsTable from '../components/ResultsTable';
import LoadingSpinner from '../components/LoadingSpinner';
import socketService from '../services/socket';
import axios from 'axios';

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get('projectId');
  
  // States
  const [countries, setCountries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processStep, setProcessStep] = useState('idle'); // idle, generating, fetching, done
  const [customCategoryCounter, setCustomCategoryCounter] = useState(1); // Counter for unique custom category IDs
  const [progressData, setProgressData] = useState({
    total: 0,
    current: 0,
    currentItem: null,
    status: null
  });
  const [currentProject, setCurrentProject] = useState(null);

  // Fetch countries and categories on load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch countries
        const countriesResponse = await axios.get('/api/criteria/countries');
        if (countriesResponse.data.success) {
          setCountries(countriesResponse.data.data);
        }

        // Fetch categories
        const categoriesResponse = await axios.get('/api/criteria/categories');
        if (categoriesResponse.data.success) {
          // Add path property if not exists
          const categoriesWithPath = categoriesResponse.data.data.map(cat => ({
            ...cat,
            path: cat.path || '' // Ensure path exists
          }));
          setCategories(categoriesWithPath);
          // Default select all categories
          setSelectedCategories(categoriesWithPath.map(cat => cat.id));
        }
        
        // If projectId is provided, get project details
        if (projectId) {
          fetchProjectDetails(projectId);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Error loading initial data');
      }
    };

    fetchInitialData();
  }, [projectId]);

  // Get project details
  const fetchProjectDetails = async (id) => {
    try {
      const response = await axios.get(`/api/projects/${id}`);
      setCurrentProject(response.data);
      
      // Get results associated with the project
      fetchProjectResults(id);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Error fetching project details');
    }
  };
  
  // Get results associated with the project
  const fetchProjectResults = async (id) => {
    try {
      const response = await axios.get(`/api/projects/${id}/results`);
      if (response.data && response.data.length > 0) {
        setResults(response.data);
        setProcessStep('done');
      }
    } catch (error) {
      console.error('Error fetching project results:', error);
      // Don't show error if project doesn't have results yet
    }
  };

  // Establish WebSocket connection and listen for progress updates
  useEffect(() => {
    // Connect to WebSocket server
    socketService.connect();

    // Subscribe to Meta progress updates
    const unsubscribe = socketService.on('meta-progress', (data) => {
      setProgressData(data);
      
      // Display toasts for certain events
      if (data.status === 'error') {
        toast.error(`Error processing "${data.currentItem}": ${data.error}`);
      } else if (data.status === 'global-error') {
        toast.error(`Global error: ${data.error}`);
      } else if (data.status === 'finished') {
        toast.success('All criteria have been processed successfully!');
      }
    });

    // Cleanup on disconnect
    return () => {
      unsubscribe();
      socketService.disconnect();
    };
  }, []);

  // Function to add a custom category
  const handleAddCustomCategory = (categoryName, categoryPath = '') => {
    // Check if category already exists (case insensitive)
    const categoryExists = categories.some(
      cat => cat.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (categoryExists) {
      toast.warning(`Category "${categoryName}" already exists`);
      return;
    }

    // Create unique ID for custom category
    const customId = `custom_${customCategoryCounter}`;
    
    // Add new category
    const newCategory = {
      id: customId,
      name: categoryName,
      path: categoryPath,
      isCustom: true // Mark category as custom
    };
    
    // Update categories list
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    
    // Automatically select new category
    setSelectedCategories([...selectedCategories, customId]);
    
    // Increment counter for next custom category
    setCustomCategoryCounter(prev => prev + 1);
    
    // Notification
    toast.success(`Category "${categoryName}" added successfully`);
  };
  
  // Function to update a category
  const handleUpdateCategory = (categoryId, newName, newPath = '') => {
    // Check if category exists
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
    
    if (categoryIndex === -1) {
      toast.error('Category not found');
      return;
    }
    
    // Update the category
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex] = {
      ...updatedCategories[categoryIndex],
      name: newName,
      path: newPath
    };
    
    setCategories(updatedCategories);
    toast.success(`Category updated successfully`);
  };

  // Start search process
  const handleSearch = async () => {
    if (!selectedCountry) {
      toast.warning('Please select a country');
      return;
    }

    if (selectedCategories.length === 0) {
      toast.warning('Please select at least one category');
      return;
    }
    
    // Check if a project is selected
    if (!projectId && !currentProject) {
      toast.warning('No project selected. Please create a project before starting a search.');
      navigate('/projects');
      return;
    }

    setIsLoading(true);
    setResults([]);
    setProcessStep('generating');
    setProgressData({
      total: 0,
      current: 0,
      currentItem: null,
      status: null
    });

    try {
      // Step 1: Generate criteria with OpenAI for each category
      const allCriteria = [];
      
      for (const categoryId of selectedCategories) {
        const category = categories.find(c => c.id === categoryId);
        const countryName = countries.find(c => c.code === selectedCountry)?.name;
        
        toast.info(`Generating criteria for: ${category.name}`);
        
        const criteriaResponse = await axios.get('/api/criteria/generate', {
          params: {
            category: category.name,
            country: countryName,
            maxResults: 500 // Increased to 500 criteria per category for maximum coverage
          }
        });
        
        if (criteriaResponse.data.success) {
          const criteria = criteriaResponse.data.data.map(criterion => ({
            criterion,
            category: category.name,
            categoryPath: category.path || ''
          }));
          
          allCriteria.push(...criteria);
        }
      }
      
      if (allCriteria.length === 0) {
        toast.error('No criteria could be generated');
        setIsLoading(false);
        setProcessStep('idle');
        return;
      }
      
      // Step 2: Get Meta suggestions for all criteria
      setProcessStep('fetching');
      toast.info(`Fetching Meta suggestions for ${allCriteria.length} criteria...`);
      
      const countryName = countries.find(c => c.code === selectedCountry)?.name;
      const batchResponse = await axios.post('/api/meta/batch-suggestions', {
        criteria: allCriteria.map(c => c.criterion),
        country: countryName,
        similarityThreshold: 0.3
      });
      
      if (batchResponse.data.success) {
        // Format results
        const formattedResults = batchResponse.data.data.map((item, index) => {
          const categoryInfo = allCriteria.find(c => c.criterion === item.original_criterion);
          
          return {
            id: index + 1,
            criterion: item.original_criterion,
            category: categoryInfo ? categoryInfo.category : 'Uncategorized',
            categoryPath: categoryInfo ? categoryInfo.categoryPath : '',
            fullPath: categoryInfo && categoryInfo.categoryPath ? 
              `${categoryInfo.categoryPath}${categoryInfo.categoryPath ? ' -- ' : ''}${item.original_criterion}` : 
              item.original_criterion,
            matches: item.matches || [],
            bestMatch: item.matches && item.matches.length > 0 ? item.matches[0] : null
          };
        });
        
        setResults(formattedResults);
        
        // Save results to project
        if (projectId || currentProject) {
          const pid = projectId || currentProject._id;
          await saveResultsToProject(pid, formattedResults, countryName);
        }
        
        toast.success('Search completed successfully!');
      } else {
        toast.error('Error fetching Meta suggestions');
      }
    } catch (error) {
      console.error('Error during search process:', error);
      toast.error('Error during search process');
    } finally {
      setIsLoading(false);
      setProcessStep('done');
    }
  };
  
  // Save results to project
  const saveResultsToProject = async (projectId, results, country) => {
    try {
      await axios.post(`/api/projects/${projectId}/results`, {
        results,
        country,
        categories: selectedCategories.map(id => {
          const category = categories.find(c => c.id === id);
          return category ? category.name : id;
        })
      });
      
      // Update project status
      await axios.put(`/api/projects/${projectId}`, {
        status: 'Completed'
      });
      
      toast.success('Results saved to project');
    } catch (error) {
      console.error('Error saving results:', error);
      toast.error('Error saving results');
    }
  };
  
  // Return to projects list
  const goBackToProjects = () => {
    navigate('/projects');
  };

  // Calculate statistics
  const calculateStatistics = () => {
    if (!results || results.length === 0) return null;

    // Number of criteria
    const totalCriteria = results.length;
    
    // Number of matches
    const totalMatches = results.reduce((sum, item) => sum + (item.matches ? item.matches.length : 0), 0);
    
    // Average matches per criterion
    const averageMatches = totalMatches / totalCriteria;
    
    // Criterion with most matches
    const maxCriterion = results.reduce((max, item) => 
      (item.matches && item.matches.length > (max?.matches?.length || 0)) ? item : max, null);
    
    return {
      totalCriteria,
      totalMatches,
      averageMatches,
      maxCriterion
    };
  };

  const statistics = calculateStatistics();
  const countryName = countries.find(c => c.code === selectedCountry)?.name || '';

  // Handle manual selection of a match
  const handleSelectMatch = (resultId, match) => {
    // Find the result by ID
    const updatedResults = results.map(result => {
      if (result.id === resultId) {
        // Update the bestMatch with the selected match
        return {
          ...result,
          bestMatch: match
        };
      }
      return result;
    });
    
    // Update results state
    setResults(updatedResults);
    
    // Show success message
    toast.success(`Critère "${match.name}" sélectionné comme meilleur match.`);
  };

  // Handle deletion of results
  const handleDeleteResults = (resultIds) => {
    // Filter out the results to be deleted
    const updatedResults = results.filter(result => !resultIds.includes(result.id));
    
    // Update results state
    setResults(updatedResults);
    
    // Update project results in the database
    if (currentProject && currentProject._id) {
      updateProjectResults(currentProject._id, updatedResults);
    }
    
    // Show success message
    if (resultIds.length === 1) {
      toast.success('Résultat supprimé avec succès.');
    } else {
      toast.success(`${resultIds.length} résultats supprimés avec succès.`);
    }
  };

  // Update project results in the database
  const updateProjectResults = async (projectId, updatedResults) => {
    try {
      await axios.post(`/api/projects/${projectId}/results`, {
        results: updatedResults,
        country: selectedCountry,
        categories: selectedCategories.map(id => {
          const category = categories.find(c => c.id === id);
          return category ? category.name : id;
        })
      });
    } catch (error) {
      console.error('Error updating project results:', error);
      toast.error('Erreur lors de la mise à jour des résultats.');
    }
  };

  // Component rendering
  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center">
            <Button 
              variant="outline-secondary" 
              className="me-3" 
              onClick={goBackToProjects}
            >
              <FaArrowLeft />
            </Button>
            <div>
              <h1 className="mb-0">
                {currentProject ? `Search: ${currentProject.name}` : 'Dashboard'}
              </h1>
              <p className="text-muted">
                {currentProject 
                  ? currentProject.description 
                  : 'Generate advertising criteria suggestions for Meta Ads'}
              </p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Main content */}
      {processStep === 'done' && results.length > 0 ? (
        // Display results
        <ResultsTable 
          results={results} 
          selectedCountry={selectedCountry} 
          onSelectMatch={handleSelectMatch}
          onDeleteResults={handleDeleteResults}
        />
      ) : (
        // Search interface
        <>
          <Row className="mb-4">
            <Col md={6} className="mb-4 mb-md-0">
              <Card>
                <Card.Header className="bg-primary text-white">
                  <FaSearchLocation className="me-2" /> Country Selection
                </Card.Header>
                <Card.Body>
                  <CountrySelector 
                    countries={countries} 
                    selectedCountry={selectedCountry} 
                    onCountryChange={setSelectedCountry} 
                    disabled={isLoading}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header className="bg-primary text-white">
                  <FaLayerGroup className="me-2" /> Category Selection
                </Card.Header>
                <Card.Body>
                  <CategorySelector 
                    categories={categories} 
                    selectedCategories={selectedCategories} 
                    onCategoryChange={setSelectedCategories}
                    onAddCustomCategory={handleAddCustomCategory}
                    onUpdateCategory={handleUpdateCategory}
                    disabled={isLoading}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <div className="d-grid">
                <Button 
                  variant="success" 
                  size="lg" 
                  onClick={handleSearch}
                  disabled={isLoading || !selectedCountry || selectedCategories.length === 0}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Search in progress...
                    </>
                  ) : (
                    <>Start Search</>
                  )}
                </Button>
              </div>
            </Col>
          </Row>

          {/* Progress display */}
          {isLoading && (
            <Row>
              <Col>
                <Card className="mb-4">
                  <Card.Header className="bg-info text-white">
                    <FaDatabase className="me-2" /> Progress
                  </Card.Header>
                  <Card.Body>
                    {processStep === 'generating' && (
                      <Alert variant="info">
                        Generating criteria in progress...
                      </Alert>
                    )}
                    
                    {processStep === 'fetching' && (
                      <>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Progress: {progressData.current} / {progressData.total}</span>
                            <span>{Math.round((progressData.current / progressData.total) * 100)}%</span>
                          </div>
                          <div className="progress">
                            <div 
                              className="progress-bar progress-bar-striped progress-bar-animated" 
                              role="progressbar" 
                              style={{ width: `${(progressData.current / progressData.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {progressData.currentItem && (
                          <Alert variant="info">
                            Currently processing: "{progressData.currentItem}"
                          </Alert>
                        )}
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}
    </Container>
  );
};

export default Dashboard;