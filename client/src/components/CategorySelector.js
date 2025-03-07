import React, { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';

/**
 * Composant de sélection des catégories
 * @param {Array} categories - Liste des catégories disponibles
 * @param {Array} selectedCategories - IDs des catégories sélectionnées
 * @param {function} onCategoryChange - Fonction appelée lors du changement de sélection
 * @param {boolean} disabled - Désactive les contrôles si true
 * @param {function} onAddCustomCategory - Fonction pour ajouter une catégorie personnalisée
 */
const CategorySelector = ({ 
  categories, 
  selectedCategories, 
  onCategoryChange, 
  onAddCustomCategory,
  disabled 
}) => {
  
  const [newCategory, setNewCategory] = useState('');
  
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
  
  // Gestion de l'ajout d'une catégorie personnalisée
  const handleAddCategory = () => {
    if (newCategory.trim() !== '') {
      onAddCustomCategory(newCategory.trim());
      setNewCategory('');
    }
  };
  
  // Gestion de la soumission du formulaire (pour éviter le rechargement de la page)
  const handleSubmit = (e) => {
    e.preventDefault();
    handleAddCategory();
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
      
      {/* Ajout d'une catégorie personnalisée */}
      <Form onSubmit={handleSubmit} className="mb-3">
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Ajouter une catégorie personnalisée"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            disabled={disabled}
          />
          <Button 
            variant="outline-primary" 
            onClick={handleAddCategory}
            disabled={disabled || newCategory.trim() === ''}
          >
            Ajouter
          </Button>
        </InputGroup>
        <Form.Text className="text-muted">
          Saisissez un nom de catégorie personnalisée et cliquez sur "Ajouter"
        </Form.Text>
      </Form>
      
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
