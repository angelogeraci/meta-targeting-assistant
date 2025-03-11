import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Table, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import axios from 'axios';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // State for the project being edited/deleted
  const [currentProject, setCurrentProject] = useState({
    name: '',
    description: '',
    status: 'In Progress',
    targetAudience: ''
  });

  // Load projects when component mounts
  useEffect(() => {
    fetchProjects();
  }, []);

  // Function to fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/projects');
      setProjects(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Unable to load projects. Please try again later.');
      setLoading(false);
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create a new project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/projects', currentProject);
      setShowCreateModal(false);
      setCurrentProject({
        name: '',
        description: '',
        status: 'In Progress',
        targetAudience: ''
      });
      fetchProjects();
      
      // Redirect to dashboard to start the search
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Unable to create project. Please try again later.');
    }
  };

  // Update a project
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/projects/${currentProject._id}`, currentProject);
      setShowEditModal(false);
      fetchProjects();
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Unable to update project. Please try again later.');
    }
  };

  // Delete a project
  const handleDeleteProject = async () => {
    try {
      await axios.delete(`/api/projects/${currentProject._id}`);
      setShowDeleteModal(false);
      fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Unable to delete project. Please try again later.');
    }
  };

  // Open the edit modal with project data
  const openEditModal = (project) => {
    setCurrentProject(project);
    setShowEditModal(true);
  };

  // Open the delete modal with project data
  const openDeleteModal = (project) => {
    setCurrentProject(project);
    setShowDeleteModal(true);
  };
  
  // Navigate to dashboard to view results
  const viewResults = (projectId) => {
    navigate(`/dashboard?projectId=${projectId}`);
  };
  
  // Start a new search
  const startNewSearch = () => {
    setShowCreateModal(true);
  };

  // Form for creating/editing a project
  const ProjectForm = ({ onSubmit, buttonText }) => (
    <Form onSubmit={onSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Project Name</Form.Label>
        <Form.Control 
          type="text" 
          name="name" 
          value={currentProject.name} 
          onChange={handleChange} 
          required 
          placeholder="Enter a name for your search"
        />
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control 
          as="textarea" 
          rows={3} 
          name="description" 
          value={currentProject.description} 
          onChange={handleChange}
          placeholder="Describe the purpose of this search"
        />
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label>Target Audience</Form.Label>
        <Form.Control 
          type="text" 
          name="targetAudience" 
          value={currentProject.targetAudience} 
          onChange={handleChange}
          placeholder="Describe the target audience (optional)"
        />
      </Form.Group>
      
      <Button variant="primary" type="submit" className="w-100">
        {buttonText}
      </Button>
    </Form>
  );

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h1>My Searches</h1>
          <p className="text-muted">Manage your advertising criteria searches and access results</p>
        </Col>
        <Col xs="auto" className="d-flex align-items-center">
          <Button variant="primary" onClick={startNewSearch}>
            <FaPlus className="me-2" /> New Search
          </Button>
        </Col>
      </Row>
      
      {error && (
        <Row className="mb-4">
          <Col>
            <div className="alert alert-danger">{error}</div>
          </Col>
        </Row>
      )}
      
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <Row>
          {projects.length === 0 ? (
            <Col>
              <Card className="text-center p-5">
                <Card.Body>
                  <Card.Title className="mb-3">No searches</Card.Title>
                  <Card.Text className="mb-4">
                    You haven't created any searches yet. Start by creating a new search to find relevant advertising criteria.
                  </Card.Text>
                  <Button variant="primary" onClick={startNewSearch}>
                    <FaPlus className="me-2" /> Start a search
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ) : (
            <Col>
              <Card>
                <Card.Body className="p-0">
                  <Table hover responsive className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Target Audience</th>
                        <th>Creation Date</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map(project => (
                        <tr key={project._id}>
                          <td className="fw-bold">{project.name}</td>
                          <td>{project.description || '-'}</td>
                          <td>
                            <Badge bg={
                              project.status === 'In Progress' ? 'primary' : 
                              project.status === 'Completed' ? 'success' : 'warning'
                            }>
                              {project.status}
                            </Badge>
                          </td>
                          <td>{project.targetAudience || '-'}</td>
                          <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="d-flex justify-content-center">
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => viewResults(project._id)}
                                title="View results"
                              >
                                <FaSearch />
                              </Button>
                              <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => openEditModal(project)}
                                title="Edit"
                              >
                                <FaEdit />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => openDeleteModal(project)}
                                title="Delete"
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}
      
      {/* Create Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>New Search</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            Create a new search to find relevant advertising criteria.
            After creating the search, you will be redirected to the dashboard to
            select categories and target country.
          </p>
          <ProjectForm onSubmit={handleCreateProject} buttonText="Create and start search" />
        </Modal.Body>
      </Modal>
      
      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Search</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProjectForm onSubmit={handleUpdateProject} buttonText="Update" />
        </Modal.Body>
      </Modal>
      
      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the search "{currentProject.name}"?</p>
          <p className="text-danger">This action is irreversible and will delete all associated results.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteProject}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Projects;