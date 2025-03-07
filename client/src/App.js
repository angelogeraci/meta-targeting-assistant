import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Navbar, Nav } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CountrySelector from './components/CountrySelector';
import CategorySelector from './components/CategorySelector';
import ResultsTable from './components/ResultsTable';
import LoadingSpinner from './components/LoadingSpinner';
import axios from 'axios';

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
            maxResults: 20 // Limite à 20 critères par catégorie pour l'efficacité
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

  return (
    <div className="app">
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="#home">Meta Targeting Assistant</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link href="https://github.com/angelogeraci/meta-targeting-assistant" target="_blank">
                GitHub
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Row className="mb-4">
          <Col>
            <div className="card p-4">
              <h2 className="mb-3">Configuration</h2>
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
            </div>
          </Col>
        </Row>

        {isLoading && (
          <Row className="mb-4">
            <Col>
              <div className="card p-4">
                <LoadingSpinner 
                  message={
                    processStep === 'generating' 
                      ? 'Génération des critères via OpenAI...' 
                      : 'Récupération des suggestions Meta...'
                  }
                />
              </div>
            </Col>
          </Row>
        )}

        {results.length > 0 && (
          <Row>
            <Col>
              <div className="card p-4">
                <h2 className="mb-3">Résultats</h2>
                <ResultsTable 
                  results={results} 
                  selectedCountry={selectedCountry} 
                />
              </div>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
}

export default App;
