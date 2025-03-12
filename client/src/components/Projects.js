import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Table, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../context/AuthContext';

const Projects = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useContext(AuthContext);
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
    status: 'En cours'
  });

  // Load projects when component mounts
  useEffect(() => {
    if (isAuthenticated()) {
      fetchProjects();
    } else {
      setLoading(false);
      setError('Vous devez être connecté pour voir vos projets.');
    }
  }, [isAuthenticated]);

  // Function to fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('Fetching projects with auth headers:', axios.defaults.headers.common['Authorization']);
      const response = await axios.get('/api/projects');
      setProjects(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError('Vous devez être connecté pour voir vos projets.');
      } else {
        setError('Impossible de charger les projets. Veuillez réessayer plus tard.');
      }
    } finally {
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

  // Form for creating/editing a project
  const ProjectForm = ({ onSubmit, buttonText }) => {
    const [localProject, setLocalProject] = useState({
      name: currentProject.name,
      description: currentProject.description,
      status: currentProject.status || 'En cours'
    });

    // Mettre à jour l'état local lors de la saisie
    const handleLocalChange = (e) => {
      const { name, value } = e.target;
      setLocalProject(prev => ({
        ...prev,
        [name]: value
      }));
    };

    // Soumettre le formulaire avec les données locales
    const handleLocalSubmit = (e) => {
      e.preventDefault();
      // Appeler la fonction onSubmit du parent avec les données locales
      onSubmit(e, localProject);
    };

    return (
      <Form onSubmit={handleLocalSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Project Name</Form.Label>
          <Form.Control 
            type="text" 
            name="name" 
            value={localProject.name} 
            onChange={handleLocalChange} 
            required 
            placeholder="Enter a name for your search"
            autoFocus
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control 
            as="textarea" 
            rows={3} 
            name="description" 
            value={localProject.description} 
            onChange={handleLocalChange}
            placeholder="Describe the purpose of this search"
          />
        </Form.Group>
        
        <Button variant="primary" type="submit" className="w-100">
          {buttonText}
        </Button>
      </Form>
    );
  };

  // Create a new project
  const handleCreateProject = async (e, formData) => {
    e.preventDefault();
    
    if (!isAuthenticated()) {
      toast.error('Vous devez être connecté pour créer un projet.');
      return;
    }
    
    try {
      // Utiliser les données du formulaire directement
      const projectToCreate = {
        ...formData,
        status: 'En cours', // Utiliser la valeur acceptée par le modèle
        user: currentUser?.id // S'assurer que l'ID de l'utilisateur est inclus
      };
      
      console.log('Creating project with data:', projectToCreate);
      console.log('Auth headers:', axios.defaults.headers.common['Authorization']);
      
      const response = await axios.post('/api/projects', projectToCreate);
      const createdProject = response.data;
      
      toast.success('Projet créé avec succès!');
      setShowCreateModal(false);
      setCurrentProject({
        name: '',
        description: '',
        status: 'En cours'
      });
      fetchProjects();
      
      // Redirect to dashboard with the project ID
      navigate(`/dashboard?projectId=${createdProject._id}`);
    } catch (err) {
      console.error('Error creating project:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        toast.error('Vous devez être connecté pour créer un projet.');
      } else {
        toast.error(err.response?.data?.message || 'Impossible de créer le projet. Veuillez réessayer plus tard.');
      }
    }
  };

  // Update a project
  const handleUpdateProject = async (e, formData) => {
    e.preventDefault();
    try {
      // Utiliser les données du formulaire directement
      await axios.put(`/api/projects/${currentProject._id}`, {
        ...formData,
        _id: currentProject._id
      });
      setShowEditModal(false);
      fetchProjects();
      toast.success('Projet mis à jour avec succès!');
    } catch (err) {
      console.error('Error updating project:', err);
      toast.error('Impossible de mettre à jour le projet. Veuillez réessayer plus tard.');
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