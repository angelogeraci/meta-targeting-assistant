import React from 'react';
import { Form } from 'react-bootstrap';

/**
 * Composant de sélection des catégories
 * @param {Array} categories - Liste des catégories disponibles
 * @param {Array} selectedCategories - IDs des catégories sélectionnées
 * @param {function} onCategoryChange - Fonction appelée lors du changement de sélection
 * @param {boolean} disabled - Désactive les contrôles si true
 */
const CategorySelector = ({ categories, selectedCategories, onCategoryChange, disabled }) => {
  
  // Gestion des cases à cocher
  const handleCheckboxChange = (e) => {
    const categoryId = e.target.value;
    const isChecked = e.target.checked;
    
    if (isChecked) {
      // Ajouter la catégorie si elle n'est pas déjà sélectionnée
      if (!selectedCategories.includes(categoryId)) {
        onCategoryChange([...selectedCategories, categoryId]);
      }
    } else {
      // Supprimer la catégorie
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    }
  };
  
  // Sélectionner ou désélectionner toutes les catégories
  const handleSelectAll = (select) => {
    if (select) {
      onCategoryChange(categories.map(category => category.id));
    } else {
      onCategoryChange([]);
    }
  };
  
  return (
    <Form.Group className="mb-3">
      <Form.Label>
        <strong>Catégories</strong>
      </Form.Label>
      
      <div className="mb-2">
        <button 
          type="button" 
          className="btn btn-sm btn-outline-primary me-2" 
          onClick={() => handleSelectAll(true)}
          disabled={disabled}
        >
          Tout sélectionner
        </button>
        <button 
          type="button" 
          className="btn btn-sm btn-outline-secondary" 
          onClick={() => handleSelectAll(false)}
          disabled={disabled}
        >
          Tout désélectionner
        </button>
      </div>
      
      <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ced4da', borderRadius: '0.25rem', padding: '0.5rem' }}>
        {categories.map((category) => (
          <Form.Check
            key={category.id}
            type="checkbox"
            id={`category-${category.id}`}
            label={category.name}
            value={category.id}
            checked={selectedCategories.includes(category.id)}
            onChange={handleCheckboxChange}
            disabled={disabled}
            className="mb-2"
          />
        ))}
      </div>
      
      <Form.Text className="text-muted">
        Sélectionnez les catégories pour lesquelles vous souhaitez des suggestions.
      </Form.Text>
    </Form.Group>
  );
};

export default CategorySelector;
