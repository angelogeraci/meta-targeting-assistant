import React, { useState } from 'react';
import { Table, Button, Badge, Accordion, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { CSVLink } from 'react-csv';
import { FaFileDownload, FaFilter, FaSort, FaSearch, FaSitemap, FaInfoCircle, FaCheck, FaTrash } from 'react-icons/fa';

/**
 * Component displaying results in a table format
 * @param {Array} results - Results to display
 * @param {string} selectedCountry - Selected country code
 */
const ResultsTable = ({ results, selectedCountry, onSelectMatch, onDeleteResults }) => {
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterScore, setFilterScore] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  
  // Extract unique categories for filtering
  const categories = [...new Set(results.map(result => result.category))];
  
  // Prepare data for CSV export
  const csvData = results.map(result => ({
    'OpenAI Criterion': result.criterion,
    'Category': result.category,
    'Path': result.categoryPath || '',
    'Full Path': result.fullPath || `${result.criterion}`,
    'Best Meta Match': result.bestMatch ? result.bestMatch.name : '',
    'Meta ID': result.bestMatch ? result.bestMatch.id : '',
    'Similarity Score': result.bestMatch ? result.bestMatch.similarity_score : '',
    'Country Audience Size': result.bestMatch ? result.bestMatch.country_audience_size : '',
    'Country': selectedCountry
  }));
  
  // Sort handling
  const handleSort = (field) => {
    if (sortField === field) {
      // Reverse direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field to sort
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Handle match selection
  const handleSelectMatch = (resultId, match) => {
    if (onSelectMatch) {
      onSelectMatch(resultId, match);
    }
  };

  // Handle row selection
  const handleRowSelect = (resultId) => {
    setSelectedRows(prev => {
      if (prev.includes(resultId)) {
        return prev.filter(id => id !== resultId);
      } else {
        return [...prev, resultId];
      }
    });
  };

  // Handle select all rows
  const handleSelectAll = () => {
    if (selectedRows.length === filteredAndSortedResults.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredAndSortedResults.map(result => result.id));
    }
  };

  // Handle delete selected rows
  const handleDeleteSelected = () => {
    if (selectedRows.length > 0 && onDeleteResults) {
      onDeleteResults(selectedRows);
      setSelectedRows([]);
    }
  };

  // Handle delete single row
  const handleDeleteRow = (resultId) => {
    if (onDeleteResults) {
      onDeleteResults([resultId]);
      setSelectedRows(prev => prev.filter(id => id !== resultId));
    }
  };
  
  // Apply filters and sorting
  const filteredAndSortedResults = [...results]
    // Filter by search
    .filter(result => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        result.criterion.toLowerCase().includes(searchLower) ||
        (result.fullPath && result.fullPath.toLowerCase().includes(searchLower)) ||
        (result.bestMatch && result.bestMatch.name.toLowerCase().includes(searchLower))
      );
    })
    // Filter by category
    .filter(result => {
      if (!filterCategory) return true;
      return result.category === filterCategory;
    })
    // Filter by score
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
    // Sort
    .sort((a, b) => {
      let compareA, compareB;
      
      // Determine values to compare based on sort field
      switch (sortField) {
        case 'criterion':
          compareA = a.criterion;
          compareB = b.criterion;
          break;
        case 'category':
          compareA = a.category;
          compareB = b.category;
          break;
        case 'path':
          compareA = a.fullPath || '';
          compareB = b.fullPath || '';
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
      
      // Comparison
      if (compareA < compareB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (compareA > compareB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  
  // Function to determine CSS class based on score
  const getScoreClass = (score) => {
    if (!score && score !== 0) return '';
    if (score >= 0.7) return 'high-score';
    if (score >= 0.4) return 'medium-score';
    return 'low-score';
  };
  
  // Function to format audience size
  const formatAudience = (size) => {
    if (!size && size !== 0) return 'N/A';
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
        <div className="d-flex align-items-center">
          <h4 className="me-3">
            {filteredAndSortedResults.length} résultats
          </h4>
          {selectedRows.length > 0 && (
            <Button 
              variant="danger" 
              size="sm" 
              onClick={handleDeleteSelected}
              className="me-2"
            >
              <FaTrash className="me-1" /> Supprimer ({selectedRows.length})
            </Button>
          )}
        </div>
        <CSVLink
          data={csvData}
          filename={`meta-targeting-${selectedCountry}-${new Date().toISOString().slice(0, 10)}.csv`}
          className="btn btn-success"
        >
          <FaFileDownload className="me-2" />
          Export to CSV
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
                placeholder="Search..."
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
                <option value="">All categories</option>
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
                <option value="">All scores</option>
                <option value="high">High score (≥ 0.7)</option>
                <option value="medium">Medium score (0.4 - 0.7)</option>
                <option value="low">Low score (&lt; 0.4)</option>
                <option value="none">No match</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="table-container">
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedRows.length === filteredAndSortedResults.length && filteredAndSortedResults.length > 0}
                    onChange={handleSelectAll}
                    id="selectAllCheckbox"
                  />
                  <label className="form-check-label" htmlFor="selectAllCheckbox">
                    Tous
                  </label>
                </div>
              </th>
              <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                # <FaSort className="ms-1" />
              </th>
              <th onClick={() => handleSort('criterion')} style={{ cursor: 'pointer' }}>
                OpenAI Criterion <FaSort className="ms-1" />
              </th>
              <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                Category <FaSort className="ms-1" />
              </th>
              <th onClick={() => handleSort('path')} style={{ cursor: 'pointer' }}>
                Path <FaSort className="ms-1" />
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Full hierarchical path including category path and criterion</Tooltip>}
                >
                  <FaInfoCircle className="ms-2 text-muted" style={{ fontSize: '0.8em' }} />
                </OverlayTrigger>
              </th>
              <th onClick={() => handleSort('meta_match')} style={{ cursor: 'pointer' }}>
                Meta Match <FaSort className="ms-1" />
              </th>
              <th onClick={() => handleSort('score')} style={{ cursor: 'pointer' }}>
                Score <FaSort className="ms-1" />
              </th>
              <th>
                {selectedCountry} Audience
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Audience size specific to {selectedCountry}</Tooltip>}
                >
                  <FaInfoCircle className="ms-2 text-muted" style={{ fontSize: '0.8em' }} />
                </OverlayTrigger>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedResults.length > 0 ? (
              filteredAndSortedResults.map((result) => (
                <tr key={result.id} className={selectedRows.includes(result.id) ? 'table-active' : ''}>
                  <td>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={selectedRows.includes(result.id)}
                        onChange={() => handleRowSelect(result.id)}
                        id={`checkbox-${result.id}`}
                      />
                    </div>
                  </td>
                  <td>{result.id}</td>
                  <td>{result.criterion}</td>
                  <td>
                    <Badge bg="info">{result.category}</Badge>
                  </td>
                  <td>
                    {result.categoryPath ? (
                      <div className="d-flex align-items-center">
                        <FaSitemap className="me-2 text-secondary" />
                        <span>{result.fullPath || result.criterion}</span>
                      </div>
                    ) : (
                      <span className="text-muted">None</span>
                    )}
                  </td>
                  <td>
                    {result.bestMatch ? (
                      result.bestMatch.name
                    ) : (
                      <span className="text-muted">No match</span>
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
                      formatAudience(result.bestMatch.country_audience_size)
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <div className="d-flex">
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => handleDeleteRow(result.id)}
                        title="Supprimer ce résultat"
                        className="me-2"
                      >
                        <FaTrash />
                      </Button>
                      
                      {result.matches && result.matches.length > 0 && (
                        <Accordion className="mt-2">
                          <Accordion.Item eventKey="0">
                            <Accordion.Header>
                              View all matches ({result.matches.length})
                            </Accordion.Header>
                            <Accordion.Body>
                              <div className="mb-2 text-muted small">
                                Cliquez sur "Sélectionner" pour choisir un critère différent comme meilleur match.
                              </div>
                              <Table size="sm">
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    <th>Score</th>
                                    <th>{selectedCountry} Audience</th>
                                    <th>ID</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.matches.map((match, idx) => (
                                    <tr key={idx} className={getScoreClass(match.similarity_score)}>
                                      <td>{match.name}</td>
                                      <td>{(match.similarity_score * 100).toFixed(0)}%</td>
                                      <td>{formatAudience(match.country_audience_size)}</td>
                                      <td>
                                        <small>{match.id}</small>
                                      </td>
                                      <td>
                                        {result.bestMatch && result.bestMatch.id === match.id ? (
                                          <Badge bg="success">
                                            <FaCheck className="me-1" /> Sélectionné
                                          </Badge>
                                        ) : (
                                          <Button 
                                            size="sm" 
                                            variant="outline-primary"
                                            onClick={() => handleSelectMatch(result.id, match)}
                                          >
                                            Sélectionner
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </Accordion.Body>
                          </Accordion.Item>
                        </Accordion>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center">
                  No results match the filter criteria
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