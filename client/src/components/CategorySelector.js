import React, { useState } from 'react';
import { Form, Button, InputGroup, Row, Col, Card, Modal } from 'react-bootstrap';
import { FaEdit, FaTrash, FaSitemap } from 'react-icons/fa';

/**
 * Category selection component
 * @param {Array} categories - List of available categories
 * @param {Array} selectedCategories - IDs of selected categories
 * @param {function} onCategoryChange - Function called when selection changes
 * @param {boolean} disabled - Disables controls if true
 * @param {function} onAddCustomCategory - Function to add a custom category
 * @param {function} onUpdateCategory - Function to update a category
 */
const CategorySelector = ({ 
  categories, 
  selectedCategories, 
  onCategoryChange, 
  onAddCustomCategory,
  onUpdateCategory,
  disabled 
}) => {
  
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryPath, setNewCategoryPath] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryPath, setEditCategoryPath] = useState('');
  
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
      onAddCustomCategory(newCategory.trim(), newCategoryPath.trim());
      setNewCategory('');
      setNewCategoryPath('');
    }
  };
  
  // Open edit modal
  const handleEditCategory = (category) => {
    setEditCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryPath(category.path || '');
    setShowModal(true);
  };
  
  // Update category
  const handleUpdateCategory = () => {
    if (editCategoryName.trim() !== '' && editCategory) {
      onUpdateCategory(editCategory.id, editCategoryName.trim(), editCategoryPath.trim());
      setShowModal(false);
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
        <Row className="g-2">
          <Col md={5}>
            <Form.Control
              type="text"
              placeholder="Category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              disabled={disabled}
            />
          </Col>
          <Col md={5}>
            <Form.Control
              type="text"
              placeholder="Path (e.g., Group -- Subgroup)"
              value={newCategoryPath}
              onChange={(e) => setNewCategoryPath(e.target.value)}
              disabled={disabled}
            />
          </Col>
          <Col md={2}>
            <Button 
              variant="outline-primary" 
              onClick={handleAddCategory}
              disabled={disabled || newCategory.trim() === ''}
              className="w-100"
            >
              Add
            </Button>
          </Col>
        </Row>
        <Form.Text className="text-muted">
          Enter a category name and path (optional), then click "Add"
        </Form.Text>
      </Form>
      
      <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ced4da', borderRadius: '0.25rem', padding: '0.5rem' }}>
        {categories.map((category) => (
          <div 
            key={category.id} 
            className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded"
          >
            <Form.Check
              type="checkbox"
              id={`category-${category.id}`}
              label={
                <div>
                  <span className="fw-medium">{category.name}</span>
                  {category.path && (
                    <span className="text-muted ms-2 small">
                      <FaSitemap className="me-1" />
                      {category.path}
                    </span>
                  )}
                </div>
              }
              value={category.id}
              checked={selectedCategories.includes(category.id)}
              onChange={handleCheckboxChange}
              disabled={disabled}
            />
            
            <div className="d-flex">
              <Button 
                variant="link" 
                className="p-0 me-2 text-secondary" 
                onClick={() => handleEditCategory(category)}
                disabled={disabled}
                title="Edit category"
              >
                <FaEdit />
              </Button>
            </div>
          </div>
        ))}
        
        {categories.length === 0 && (
          <p className="text-center text-muted my-3">No categories available. Add one above.</p>
        )}
      </div>
      
      <Form.Text className="text-muted">
        Select the categories for which you want suggestions.
      </Form.Text>
      
      {/* Edit Category Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Category Name</Form.Label>
              <Form.Control
                type="text"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Path</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Group -- Subgroup"
                value={editCategoryPath}
                onChange={(e) => setEditCategoryPath(e.target.value)}
              />
              <Form.Text className="text-muted">
                Define the hierarchical path for this category (use -- as separators)
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateCategory}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Form.Group>
  );
};

export default CategorySelector;
