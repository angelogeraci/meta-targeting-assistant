import React, { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';

/**
 * Category selection component
 * @param {Array} categories - List of available categories
 * @param {Array} selectedCategories - IDs of selected categories
 * @param {function} onCategoryChange - Function called when selection changes
 * @param {boolean} disabled - Disables controls if true
 * @param {function} onAddCustomCategory - Function to add a custom category
 */
const CategorySelector = ({ 
  categories, 
  selectedCategories, 
  onCategoryChange, 
  onAddCustomCategory,
  disabled 
}) => {
  
  const [newCategory, setNewCategory] = useState('');
  
  // Checkbox handler
  const handleCheckboxChange = (e) => {
    const categoryId = e.target.value;
    const isChecked = e.target.checked;
    
    if (isChecked) {
      // Add the category if it's not already selected
      if (!selectedCategories.includes(categoryId)) {
        onCategoryChange([...selectedCategories, categoryId]);
      }
    } else {
      // Remove the category
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    }
  };
  
  // Select or deselect all categories
  const handleSelectAll = (select) => {
    if (select) {
      onCategoryChange(categories.map(category => category.id));
    } else {
      onCategoryChange([]);
    }
  };
  
  // Handle adding a custom category
  const handleAddCategory = () => {
    if (newCategory.trim() !== '') {
      onAddCustomCategory(newCategory.trim());
      setNewCategory('');
    }
  };
  
  // Handle form submission (to prevent page reload)
  const handleSubmit = (e) => {
    e.preventDefault();
    handleAddCategory();
  };
  
  return (
    <Form.Group className="mb-3">
      <Form.Label>
        <strong>Categories</strong>
      </Form.Label>
      
      <div className="mb-2">
        <button 
          type="button" 
          className="btn btn-sm btn-outline-primary me-2" 
          onClick={() => handleSelectAll(true)}
          disabled={disabled}
        >
          Select All
        </button>
        <button 
          type="button" 
          className="btn btn-sm btn-outline-secondary" 
          onClick={() => handleSelectAll(false)}
          disabled={disabled}
        >
          Deselect All
        </button>
      </div>
      
      {/* Add a custom category */}
      <Form onSubmit={handleSubmit} className="mb-3">
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Add a custom category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            disabled={disabled}
          />
          <Button 
            variant="outline-primary" 
            onClick={handleAddCategory}
            disabled={disabled || newCategory.trim() === ''}
          >
            Add
          </Button>
        </InputGroup>
        <Form.Text className="text-muted">
          Enter a custom category name and click "Add"
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
        Select the categories for which you want suggestions.
      </Form.Text>
    </Form.Group>
  );
};

export default CategorySelector;
