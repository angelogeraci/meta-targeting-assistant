import React, { useState, useRef } from 'react';
import { Form, Button, InputGroup, Row, Col, Card, Modal } from 'react-bootstrap';
import { FaEdit, FaSitemap, FaPlus } from 'react-icons/fa';

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
  const [pathSegments, setPathSegments] = useState(['']);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editPathSegments, setEditPathSegments] = useState(['']);
  
  // References for the input fields
  const newPathInputRefs = useRef([]);
  const editPathInputRefs = useRef([]);
  
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
  
  // Handle adding a path segment for new category
  const handleAddPathSegment = () => {
    setPathSegments([...pathSegments, '']);
    // Focus will happen after render with useEffect
    setTimeout(() => {
      if (newPathInputRefs.current[pathSegments.length]) {
        newPathInputRefs.current[pathSegments.length].focus();
      }
    }, 10);
  };
  
  // Handle adding a path segment for edit category
  const handleAddEditPathSegment = () => {
    setEditPathSegments([...editPathSegments, '']);
    // Focus will happen after render
    setTimeout(() => {
      if (editPathInputRefs.current[editPathSegments.length]) {
        editPathInputRefs.current[editPathSegments.length].focus();
      }
    }, 10);
  };
  
  // Handle path segment change for new category
  const handlePathSegmentChange = (index, value) => {
    const newSegments = [...pathSegments];
    newSegments[index] = value;
    setPathSegments(newSegments);
  };
  
  // Handle path segment change for edit category
  const handleEditPathSegmentChange = (index, value) => {
    const newSegments = [...editPathSegments];
    newSegments[index] = value;
    setEditPathSegments(newSegments);
  };
  
  // Handle key down event for tab key
  const handleKeyDown = (e, index, isEdit = false) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      // Prevent default tab behavior
      e.preventDefault();
      
      // If it's the last segment, add a new one
      if (isEdit) {
        if (index === editPathSegments.length - 1) {
          handleAddEditPathSegment();
        }
      } else {
        if (index === pathSegments.length - 1) {
          handleAddPathSegment();
        }
      }
    }
  };
  
  // Combine path segments into a path string
  const combinePathSegments = (segments) => {
    return segments
      .filter(segment => segment.trim() !== '')
      .join(' -- ');
  };
  
  // Handle adding a custom category
  const handleAddCategory = () => {
    if (newCategory.trim() !== '') {
      const path = combinePathSegments(pathSegments);
      onAddCustomCategory(newCategory.trim(), path);
      setNewCategory('');
      setPathSegments(['']);
    }
  };
  
  // Open edit modal
  const handleEditCategory = (category) => {
    setEditCategory(category);
    setEditCategoryName(category.name);
    
    // Split path into segments if it exists
    if (category.path) {
      setEditPathSegments(category.path.split(' -- '));
    } else {
      setEditPathSegments(['']);
    }
    
    setShowModal(true);
  };
  
  // Update category
  const handleUpdateCategory = () => {
    if (editCategoryName.trim() !== '' && editCategory) {
      const path = combinePathSegments(editPathSegments);
      onUpdateCategory(editCategory.id, editCategoryName.trim(), path);
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
        <div className="mb-2">
          <Form.Label className="small mb-1">Category name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            disabled={disabled}
          />
        </div>
        
        <div className="mb-2">
          <Form.Label className="small mb-1 d-flex justify-content-between align-items-center">
            <span>Path (Tab to add level)</span>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={handleAddPathSegment}
              disabled={disabled}
            >
              <FaPlus size={12} />
            </Button>
          </Form.Label>
          
          {pathSegments.map((segment, index) => (
            <div 
              key={index} 
              className="d-flex mb-2 align-items-center"
            >
              {index > 0 && <span className="px-2 text-muted">→</span>}
              <Form.Control
                ref={el => newPathInputRefs.current[index] = el}
                type="text"
                placeholder={`Level ${index + 1}`}
                value={segment}
                onChange={(e) => handlePathSegmentChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                disabled={disabled}
              />
              {index === pathSegments.length - 1 && (
                <Button 
                  variant="outline-secondary" 
                  className="ms-2" 
                  onClick={handleAddPathSegment}
                  disabled={disabled}
                >
                  <FaPlus size={12} />
                </Button>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-end">
          <Button 
            variant="primary" 
            onClick={handleAddCategory}
            disabled={disabled || newCategory.trim() === ''}
          >
            Add Category
          </Button>
        </div>
        
        <Form.Text className="text-muted d-block mt-1">
          Enter a category name and build a path by adding levels, then click "Add Category"
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
              <Form.Label className="d-flex justify-content-between align-items-center">
                <span>Path</span>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={handleAddEditPathSegment}
                >
                  <FaPlus size={12} />
                </Button>
              </Form.Label>
              
              {editPathSegments.map((segment, index) => (
                <div 
                  key={index} 
                  className="d-flex mb-2 align-items-center"
                >
                  {index > 0 && <span className="px-2 text-muted">→</span>}
                  <Form.Control
                    ref={el => editPathInputRefs.current[index] = el}
                    type="text"
                    placeholder={`Level ${index + 1}`}
                    value={segment}
                    onChange={(e) => handleEditPathSegmentChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index, true)}
                  />
                  {index === editPathSegments.length - 1 && (
                    <Button 
                      variant="outline-secondary" 
                      className="ms-2" 
                      onClick={handleAddEditPathSegment}
                    >
                      <FaPlus size={12} />
                    </Button>
                  )}
                </div>
              ))}
              
              <Form.Text className="text-muted">
                Build the hierarchical path by adding levels (Tab key or + button to add new level)
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