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
  const [currentProject, setCurrentProject] = useState(null);

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
        
        // Si un projectId est fourni, récupérer les détails du projet
        if (projectId) {
          fetchProjectDetails(projectId);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données initiales:', error);
        toast.error('Erreur lors du chargement des données initiales');
      }
    };

    fetchInitialData();
  }, [projectId]);

  // Récupérer les détails du projet
  const fetchProjectDetails = async (id) => {
    try {
      const response = await axios.get(`/api/projects/${id}`);
      setCurrentProject(response.data);
      
      // Récupérer les résultats associés au projet
      fetchProjectResults(id);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du projet:', error);
      toast.error('Erreur lors de la récupération des détails du projet');
    }
  };
  
  // Récupérer les résultats associés au projet
  const fetchProjectResults = async (id) => {
    try {
      const response = await axios.get(`/api/projects/${id}/results`);
      if (response.data && response.data.length > 0) {
        setResults(response.data);
        setProcessStep('done');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats du projet:', error);
      // Ne pas afficher d'erreur si le projet n'a pas encore de résultats
    }
  };

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
    
    // Vérifier si un projet est sélectionné
    if (!projectId && !currentProject) {
      toast.warning('Aucun projet sélectionné. Veuillez créer un projet avant de lancer une recherche.');
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
        
        // Sauvegarder les résultats dans le projet
        if (projectId || currentProject) {
          const pid = projectId || currentProject._id;
          await saveResultsToProject(pid, formattedResults, countryName);
        }
        
        toast.success('Recherche terminée avec succès!');
      } else {
        toast.error('Erreur lors de la récupération des suggestions Meta');
      }
    } catch (error) {
      console.error('Erreur lors du processus de recherche:', error);
      toast.error('Erreur lors du processus de recherche');
    } finally {
      setIsLoading(false);
      setProcessStep('done');
    }
  };
  
  // Sauvegarder les résultats dans le projet
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
      
      // Mettre à jour le statut du projet
      await axios.put(`/api/projects/${projectId}`, {
        status: 'Terminé'
      });
      
      toast.success('Résultats sauvegardés dans le projet');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des résultats:', error);
      toast.error('Erreur lors de la sauvegarde des résultats');
    }
  };
  
  // Retourner à la liste des projets
  const goBackToProjects = () => {
    navigate('/projects');
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

  // Rendu du composant
  return (
    <Container fluid className="py-4">
      {/* En-tête */}
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
                {currentProject ? `Recherche: ${currentProject.name}` : 'Tableau de bord'}
              </h1>
              <p className="text-muted">
                {currentProject 
                  ? currentProject.description 
                  : 'Générez des suggestions de critères publicitaires pour Meta Ads'}
              </p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Contenu principal */}
      {processStep === 'done' && results.length > 0 ? (
        // Affichage des résultats
        <ResultsTable results={results} />
      ) : (
        // Interface de recherche
        <>
          <Row className="mb-4">
            <Col md={6} className="mb-4 mb-md-0">
              <Card>
                <Card.Header className="bg-primary text-white">
                  <FaSearchLocation className="me-2" /> Sélection du pays
                </Card.Header>
                <Card.Body>
                  <CountrySelector 
                    countries={countries} 
                    selectedCountry={selectedCountry} 
                    onChange={setSelectedCountry} 
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header className="bg-primary text-white">
                  <FaLayerGroup className="me-2" /> Sélection des catégories
                </Card.Header>
                <Card.Body>
                  <CategorySelector 
                    categories={categories} 
                    selectedCategories={selectedCategories} 
                    onChange={setSelectedCategories}
                    onAddCustomCategory={handleAddCustomCategory}
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
                      Recherche en cours...
                    </>
                  ) : (
                    <>Lancer la recherche</>
                  )}
                </Button>
              </div>
            </Col>
          </Row>

          {/* Affichage de la progression */}
          {isLoading && (
            <Row>
              <Col>
                <Card className="mb-4">
                  <Card.Header className="bg-info text-white">
                    <FaDatabase className="me-2" /> Progression
                  </Card.Header>
                  <Card.Body>
                    {processStep === 'generating' && (
                      <Alert variant="info">
                        Génération des critères en cours...
                      </Alert>
                    )}
                    
                    {processStep === 'fetching' && (
                      <>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Progression: {progressData.current} / {progressData.total}</span>
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
                            Traitement en cours: "{progressData.currentItem}"
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
