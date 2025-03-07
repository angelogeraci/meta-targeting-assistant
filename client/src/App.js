import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Navbar, Badge, Card, ProgressBar } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CountrySelector from './components/CountrySelector';
import CategorySelector from './components/CategorySelector';
import ResultsTable from './components/ResultsTable';
import LoadingSpinner from './components/LoadingSpinner';
import socketService from './services/socket';
import axios from 'axios';
import { FaSearchLocation, FaLayerGroup, FaDatabase, FaChartLine, FaBell, FaQuestionCircle, FaCog, FaUser } from 'react-icons/fa';

function App() {
  // États
  const [countries, setCountries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processStep, setProcessStep] = useState('idle'); // idle, generating, fetching, done
  const [customCategoryCounter, setCustomCategoryCounter] = useState(1); // Compteur pour les IDs uniques des catégories personnalisées
  const [progressData, setProgressData] = useState({
    total: 0,
    current: 0,
    currentItem: null,
    status: null
  });

  // Récupération des pays et catégories au chargement
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Récupération des pays
        const countriesResponse = await axios.get('/api/criteria/countries');
        if (countriesResponse.data.success) {
          setCountries(countriesResponse.data.data);
        }

        // Récupération des catégories
        const categoriesResponse = await axios.get('/api/criteria/categories');
        if (categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.data);
          // Sélection par défaut de toutes les catégories
          setSelectedCategories(categoriesResponse.data.data.map(cat => cat.id));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données initiales:', error);
        toast.error('Erreur lors du chargement des données initiales');
      }
    };

    fetchInitialData();
  }, []);

  // Établir la connexion WebSocket et écouter les mises à jour de progression
  useEffect(() => {
    // Connecter au serveur WebSocket
    socketService.connect();

    // S'abonner aux mises à jour de progression Meta
    const unsubscribe = socketService.on('meta-progress', (data) => {
      setProgressData(data);
      
      // Afficher des toasts pour certains événements
      if (data.status === 'error') {
        toast.error(`Erreur lors du traitement de "${data.currentItem}": ${data.error}`);
      } else if (data.status === 'global-error') {
        toast.error(`Erreur globale: ${data.error}`);
      } else if (data.status === 'finished') {
        toast.success('Tous les critères ont été traités avec succès!');
      }
    });

    // Nettoyer à la déconnexion
    return () => {
      unsubscribe();
      socketService.disconnect();
    };
  }, []);

  // Fonction pour ajouter une catégorie personnalisée
  const handleAddCustomCategory = (categoryName) => {
    // Vérifier si la catégorie existe déjà (insensible à la casse)
    const categoryExists = categories.some(
      cat => cat.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (categoryExists) {
      toast.warning(`La catégorie "${categoryName}" existe déjà`);
      return;
    }

    // Créer un ID unique pour la catégorie personnalisée
    const customId = `custom_${customCategoryCounter}`;
    
    // Ajouter la nouvelle catégorie
    const newCategory = {
      id: customId,
      name: categoryName,
      isCustom: true // Marque la catégorie comme personnalisée
    };
    
    // Mettre à jour la liste des catégories
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    
    // Sélectionner automatiquement la nouvelle catégorie
    setSelectedCategories([...selectedCategories, customId]);
    
    // Incrémenter le compteur pour la prochaine catégorie personnalisée
    setCustomCategoryCounter(prev => prev + 1);
    
    // Notification
    toast.success(`Catégorie "${categoryName}" ajoutée avec succès`);
  };

  // Lancement du processus de recherche
  const handleSearch = async () => {
    if (!selectedCountry) {
      toast.warning('Veuillez sélectionner un pays');
      return;
    }

    if (selectedCategories.length === 0) {
      toast.warning('Veuillez sélectionner au moins une catégorie');
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
      // Étape 1: Générer des critères avec OpenAI pour chaque catégorie
      const allCriteria = [];
      
      for (const categoryId of selectedCategories) {
        const category = categories.find(c => c.id === categoryId);
        const countryName = countries.find(c => c.code === selectedCountry)?.name;
        
        toast.info(`Génération de critères pour: ${category.name}`);
        
        const criteriaResponse = await axios.get('/api/criteria/generate', {
          params: {
            category: category.name,
            country: countryName,
            maxResults: 500 // Augmenté à 500 critères par catégorie pour une exhaustivité maximale
          }
        });
        
        if (criteriaResponse.data.success) {
          const criteria = criteriaResponse.data.data.map(criterion => ({
            criterion,
            category: category.name
          }));
          
          allCriteria.push(...criteria);
        }
      }
      
      if (allCriteria.length === 0) {
        toast.error('Aucun critère n\'a pu être généré');
        setIsLoading(false);
        setProcessStep('idle');
        return;
      }
      
      // Étape 2: Récupérer les suggestions Meta pour tous les critères
      setProcessStep('fetching');
      toast.info(`Récupération des suggestions Meta pour ${allCriteria.length} critères...`);
      
      const countryName = countries.find(c => c.code === selectedCountry)?.name;
      const batchResponse = await axios.post('/api/meta/batch-suggestions', {
        criteria: allCriteria.map(c => c.criterion),
        country: countryName,
        similarityThreshold: 0.3
      });
      
      if (batchResponse.data.success) {
        // Formatage des résultats
        const formattedResults = batchResponse.data.data.map((item, index) => {
          const categoryInfo = allCriteria.find(c => c.criterion === item.original_criterion);
          
          return {
            id: index + 1,
            criterion: item.original_criterion,
            category: categoryInfo ? categoryInfo.category : 'Non catégorisé',
            matches: item.matches || [],
            bestMatch: item.matches && item.matches.length > 0 ? item.matches[0] : null
          };
        });
        
        setResults(formattedResults);
        toast.success(`${formattedResults.length} critères traités avec succès!`);
      } else {
        toast.error('Erreur lors de la récupération des suggestions Meta');
      }
    } catch (error) {
      console.error('Erreur lors du processus de recherche:', error);
      toast.error('Erreur lors du processus: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
      setProcessStep('done');
    }
  };

  // Gestion du changement de pays
  const handleCountryChange = (countryCode) => {
    setSelectedCountry(countryCode);
    // Réinitialisation des résultats
    setResults([]);
    setProcessStep('idle');
  };

  // Gestion du changement de catégories
  const handleCategoryChange = (categoryIds) => {
    setSelectedCategories(categoryIds);
    // Réinitialisation des résultats
    setResults([]);
    setProcessStep('idle');
  };

  // Calcul des statistiques
  const calculerStatistiques = () => {
    if (!results || results.length === 0) return null;

    // Nombre de critères
    const totalCritères = results.length;
    
    // Nombre de correspondances
    const totalCorrespondances = results.reduce((sum, item) => sum + (item.matches ? item.matches.length : 0), 0);
    
    // Moyenne de correspondances par critère
    const moyenneCorrespondances = totalCorrespondances / totalCritères;
    
    // Critère avec le plus de correspondances
    const critèreMax = results.reduce((max, item) => 
      (item.matches && item.matches.length > (max?.matches?.length || 0)) ? item : max, null);
    
    return {
      totalCritères,
      totalCorrespondances,
      moyenneCorrespondances,
      critèreMax
    };
  };

  const statistics = calculerStatistiques();
  const countryName = countries.find(c => c.code === selectedCountry)?.name || '';

  return (
    <div className="app">
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="#home">
            <FaSearchLocation className="me-2" />
            Meta Targeting Assistant
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link href="#"><FaBell /></Nav.Link>
              <Nav.Link href="#"><FaQuestionCircle /></Nav.Link>
              <Nav.Link href="#"><FaCog /></Nav.Link>
              <Nav.Link href="#"><FaUser /></Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div className="bg-light py-2">
        <Container>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><a href="#">Accueil</a></li>
              <li className="breadcrumb-item active">Ciblage</li>
              {selectedCountry && (
                <li className="breadcrumb-item active">{countryName}</li>
              )}
            </ol>
          </nav>
        </Container>
      </div>

      <Container className="my-4">
        {/* En-tête de la page */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1">Meta Targeting Assistant</h1>
            <p className="text-muted">Générez des suggestions de ciblage précises basées sur l'IA</p>
          </div>
          
          {selectedCountry && processStep === 'done' && (
            <div className="text-end">
              <h2 className="h5 mb-1">{countryName}</h2>
              <div>
                <Badge bg="primary" className="me-1">
                  {statistics?.totalCritères || 0} critères
                </Badge>
                <Badge bg="success">
                  {statistics?.totalCorrespondances || 0} correspondances
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Section de configuration */}
        <Card className="mb-4">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaLayerGroup className="me-2" />
                Configuration
              </h5>
              {selectedCountry && selectedCategories.length > 0 && (
                <span className="text-muted">
                  {countryName} · {selectedCategories.length} catégories
                </span>
              )}
            </div>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <CountrySelector
                  countries={countries}
                  selectedCountry={selectedCountry}
                  onCountryChange={handleCountryChange}
                  disabled={isLoading}
                />
              </Col>
              <Col md={6}>
                <CategorySelector
                  categories={categories}
                  selectedCategories={selectedCategories}
                  onCategoryChange={handleCategoryChange}
                  onAddCustomCategory={handleAddCustomCategory}
                  disabled={isLoading}
                />
              </Col>
            </Row>
            <div className="d-grid gap-2 mt-3">
              <button
                className="btn btn-primary"
                onClick={handleSearch}
                disabled={isLoading || !selectedCountry || selectedCategories.length === 0}
              >
                {isLoading ? 'Traitement en cours...' : 'Rechercher des suggestions'}
              </button>
            </div>
          </Card.Body>
        </Card>

        {/* Section de progression */}
        {isLoading && (
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <FaChartLine className="me-2" />
                Progression
              </h5>
            </Card.Header>
            <Card.Body>
              <LoadingSpinner 
                message={
                  processStep === 'generating' 
                    ? 'Génération des critères via OpenAI (jusqu\'à 500 par catégorie)...' 
                    : 'Récupération des suggestions Meta...'
                }
                progress={processStep === 'fetching' ? progressData : null}
              />
              
              {processStep === 'fetching' && progressData.total > 0 && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between mb-2">
                    <div>Progression globale</div>
                    <div>{progressData.current} / {progressData.total}</div>
                  </div>
                  <ProgressBar 
                    now={Math.floor((progressData.current / progressData.total) * 100)} 
                    label={`${Math.floor((progressData.current / progressData.total) * 100)}%`} 
                  />
                  
                  {progressData.currentItem && (
                    <div className="mt-3 p-3 bg-light rounded">
                      <h6 className="mb-1">Critère en cours de traitement:</h6>
                      <div className="text-primary fw-bold">{progressData.currentItem}</div>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Section de statistiques */}
        {results.length > 0 && statistics && (
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <FaChartLine className="me-2" />
                Aperçu des résultats
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="metric-card text-center">
                    <div className="metric-title">Critères générés</div>
                    <div className="metric-value">{statistics.totalCritères}</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="metric-card text-center">
                    <div className="metric-title">Correspondances trouvées</div>
                    <div className="metric-value">{statistics.totalCorrespondances}</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="metric-card text-center">
                    <div className="metric-title">Moyenne par critère</div>
                    <div className="metric-value">{statistics.moyenneCorrespondances.toFixed(1)}</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="metric-card text-center">
                    <div className="metric-title">Taux de correspondance</div>
                    <div className="metric-value">
                      {((statistics.totalCorrespondances / (statistics.totalCritères * 5)) * 100).toFixed(1)}%
                    </div>
                  </div>
                </Col>
              </Row>
              
              {statistics.critèreMax && (
                <div className="mt-4 p-3 bg-light rounded">
                  <h6 className="mb-1">Critère avec le plus de correspondances:</h6>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="fw-bold">{statistics.critèreMax.criterion}</div>
                    <Badge bg="primary">{statistics.critèreMax.matches.length} correspondances</Badge>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Section des résultats */}
        {results.length > 0 && (
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaDatabase className="me-2" />
                  Résultats
                </h5>
                <Badge bg="primary">{results.length} critères</Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <ResultsTable 
                results={results} 
                selectedCountry={selectedCountry} 
              />
            </Card.Body>
          </Card>
        )}
      </Container>
    </div>
  );
}

export default App;
