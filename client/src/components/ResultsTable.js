import React, { useState } from 'react';
import { Table, Button, Badge, Accordion } from 'react-bootstrap';
import { CSVLink } from 'react-csv';
import { FaFileDownload, FaFilter, FaSort, FaSearch } from 'react-icons/fa';

/**
 * Composant affichant les résultats sous forme de tableau
 * @param {Array} results - Résultats à afficher
 * @param {string} selectedCountry - Code du pays sélectionné
 */
const ResultsTable = ({ results, selectedCountry }) => {
  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterScore, setFilterScore] = useState('');
  
  // Extraction des catégories uniques pour le filtre
  const categories = [...new Set(results.map(result => result.category))];
  
  // Préparation des données pour l'export CSV
  const csvData = results.map(result => ({
    'Critère OpenAI': result.criterion,
    'Catégorie': result.category,
    'Meilleure correspondance Meta': result.bestMatch ? result.bestMatch.name : '',
    'ID Meta': result.bestMatch ? result.bestMatch.id : '',
    'Score de similarité': result.bestMatch ? result.bestMatch.similarity_score : '',
    'Taille d\'audience': result.bestMatch ? result.bestMatch.audience_size : '',
    'Pays': selectedCountry
  }));
  
  // Gestion du tri
  const handleSort = (field) => {
    if (sortField === field) {
      // Inverser la direction si on clique sur le même champ
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouveau champ à trier
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Application des filtres et du tri
  const filteredAndSortedResults = [...results]
    // Filtrage par recherche
    .filter(result => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        result.criterion.toLowerCase().includes(searchLower) ||
        (result.bestMatch && result.bestMatch.name.toLowerCase().includes(searchLower))
      );
    })
    // Filtrage par catégorie
    .filter(result => {
      if (!filterCategory) return true;
      return result.category === filterCategory;
    })
    // Filtrage par score
    .filter(result => {
      if (!filterScore) return true;
      
      const score = result.bestMatch ? result.bestMatch.similarity_score : 0;
      
      switch (filterScore) {
        case 'high':
          return score >= 0.7;
        case 'medium':
          return score >= 0.4 && score < 0.7;
        case 'low':
          return score < 0.4;
        case 'none':
          return !result.bestMatch || result.bestMatch.length === 0;
        default:
          return true;
      }
    })
    // Tri
    .sort((a, b) => {
      let compareA, compareB;
      
      // Déterminer les valeurs à comparer selon le champ de tri
      switch (sortField) {
        case 'criterion':
          compareA = a.criterion;
          compareB = b.criterion;
          break;
        case 'category':
          compareA = a.category;
          compareB = b.category;
          break;
        case 'meta_match':
          compareA = a.bestMatch ? a.bestMatch.name : '';
          compareB = b.bestMatch ? b.bestMatch.name : '';
          break;
        case 'score':
          compareA = a.bestMatch ? a.bestMatch.similarity_score : 0;
          compareB = b.bestMatch ? b.bestMatch.similarity_score : 0;
          break;
        default: // id
          compareA = a.id;
          compareB = b.id;
      }
      
      // Comparaison
      if (compareA < compareB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (compareA > compareB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  
  // Fonction pour déterminer la classe CSS selon le score
  const getScoreClass = (score) => {
    if (!score && score !== 0) return '';
    if (score >= 0.7) return 'high-score';
    if (score >= 0.4) return 'medium-score';
    return 'low-score';
  };
  
  // Fonction pour formater l'audience
  const formatAudience = (size) => {
    if (!size) return 'N/A';
    if (size >= 1000000) {
      return `${(size / 1000000).toFixed(1)}M`;
    }
    if (size >= 1000) {
      return `${(size / 1000).toFixed(1)}K`;
    }
    return size.toString();
  };
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>
          {filteredAndSortedResults.length} résultats
        </h4>
        <CSVLink
          data={csvData}
          filename={`meta-targeting-${selectedCountry}-${new Date().toISOString().slice(0, 10)}.csv`}
          className="btn btn-success"
        >
          <FaFileDownload className="me-2" />
          Exporter en CSV
        </CSVLink>
      </div>
      
      <div className="filters mb-3">
        <div className="row g-2">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text">
                <FaFilter />
              </span>
              <select
                className="form-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Toutes les catégories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text">
                <FaFilter />
              </span>
              <select
                className="form-select"
                value={filterScore}
                onChange={(e) => setFilterScore(e.target.value)}
              >
                <option value="">Tous les scores</option>
                <option value="high">Score élevé (≥ 0.7)</option>
                <option value="medium">Score moyen (0.4 - 0.7)</option>
                <option value="low">Score faible (&lt; 0.4)</option>
                <option value="none">Aucune correspondance</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="table-container">
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                # <FaSort className="ms-1" />
              </th>
              <th onClick={() => handleSort('criterion')} style={{ cursor: 'pointer' }}>
                Critère OpenAI <FaSort className="ms-1" />
              </th>
              <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                Catégorie <FaSort className="ms-1" />
              </th>
              <th onClick={() => handleSort('meta_match')} style={{ cursor: 'pointer' }}>
                Correspondance Meta <FaSort className="ms-1" />
              </th>
              <th onClick={() => handleSort('score')} style={{ cursor: 'pointer' }}>
                Score <FaSort className="ms-1" />
              </th>
              <th>Audience</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedResults.length > 0 ? (
              filteredAndSortedResults.map((result) => (
                <tr key={result.id}>
                  <td>{result.id}</td>
                  <td>{result.criterion}</td>
                  <td>
                    <Badge bg="info">{result.category}</Badge>
                  </td>
                  <td>
                    {result.bestMatch ? (
                      result.bestMatch.name
                    ) : (
                      <span className="text-muted">Aucune correspondance</span>
                    )}
                  </td>
                  <td className={result.bestMatch ? getScoreClass(result.bestMatch.similarity_score) : ''}>
                    {result.bestMatch ? (
                      `${(result.bestMatch.similarity_score * 100).toFixed(0)}%`
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {result.bestMatch ? (
                      formatAudience(result.bestMatch.audience_size)
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {result.matches && result.matches.length > 0 && (
                      <Accordion className="mt-2">
                        <Accordion.Item eventKey="0">
                          <Accordion.Header>
                            Voir toutes les correspondances ({result.matches.length})
                          </Accordion.Header>
                          <Accordion.Body>
                            <Table size="sm">
                              <thead>
                                <tr>
                                  <th>Nom</th>
                                  <th>Score</th>
                                  <th>ID</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.matches.map((match, idx) => (
                                  <tr key={idx} className={getScoreClass(match.similarity_score)}>
                                    <td>{match.name}</td>
                                    <td>{(match.similarity_score * 100).toFixed(0)}%</td>
                                    <td>
                                      <small>{match.id}</small>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Accordion.Body>
                        </Accordion.Item>
                      </Accordion>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center">
                  Aucun résultat ne correspond aux critères de filtrage
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default ResultsTable;
