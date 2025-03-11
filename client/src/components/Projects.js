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
  
  // États pour les modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // État pour le projet en cours d'édition/suppression
  const [currentProject, setCurrentProject] = useState({
    name: '',
    description: '',
    status: 'En cours',
    targetAudience: ''
  });

  // Charger les projets au chargement du composant
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fonction pour récupérer les projets
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/projects');
      setProjects(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des projets:', err);
      setError('Impossible de charger les projets. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Créer un nouveau projet
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/projects', currentProject);
      setShowCreateModal(false);
      setCurrentProject({
        name: '',
        description: '',
        status: 'En cours',
        targetAudience: ''
      });
      fetchProjects();
      
      // Rediriger vers le tableau de bord pour commencer la recherche
      navigate('/dashboard');
    } catch (err) {
      console.error('Erreur lors de la création du projet:', err);
      setError('Impossible de créer le projet. Veuillez réessayer plus tard.');
    }
  };

  // Mettre à jour un projet
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/projects/${currentProject._id}`, currentProject);
      setShowEditModal(false);
      fetchProjects();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du projet:', err);
      setError('Impossible de mettre à jour le projet. Veuillez réessayer plus tard.');
    }
  };

  // Supprimer un projet
  const handleDeleteProject = async () => {
    try {
      await axios.delete(`/api/projects/${currentProject._id}`);
      setShowDeleteModal(false);
      fetchProjects();
    } catch (err) {
      console.error('Erreur lors de la suppression du projet:', err);
      setError('Impossible de supprimer le projet. Veuillez réessayer plus tard.');
    }
  };

  // Ouvrir le modal d'édition avec les données du projet
  const openEditModal = (project) => {
    setCurrentProject(project);
    setShowEditModal(true);
  };

  // Ouvrir le modal de suppression avec les données du projet
  const openDeleteModal = (project) => {
    setCurrentProject(project);
    setShowDeleteModal(true);
  };
  
  // Naviguer vers le tableau de bord pour voir les résultats
  const viewResults = (projectId) => {
    navigate(`/dashboard?projectId=${projectId}`);
  };
  
  // Commencer une nouvelle recherche
  const startNewSearch = () => {
    setShowCreateModal(true);
  };

  // Formulaire pour créer/éditer un projet
  const ProjectForm = ({ onSubmit, buttonText }) => (
    <Form onSubmit={onSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Nom du projet</Form.Label>
        <Form.Control 
          type="text" 
          name="name" 
          value={currentProject.name} 
          onChange={handleChange} 
          required 
          placeholder="Entrez un nom pour votre recherche"
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
          placeholder="Décrivez l'objectif de cette recherche"
        />
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label>Public cible</Form.Label>
        <Form.Control 
          type="text" 
          name="targetAudience" 
          value={currentProject.targetAudience} 
          onChange={handleChange}
          placeholder="Décrivez le public cible (optionnel)"
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
          <h1>Mes Recherches</h1>
          <p className="text-muted">Gérez vos recherches de critères publicitaires et accédez aux résultats</p>
        </Col>
        <Col xs="auto" className="d-flex align-items-center">
          <Button variant="primary" onClick={startNewSearch}>
            <FaPlus className="me-2" /> Nouvelle Recherche
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
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : (
        <Row>
          {projects.length === 0 ? (
            <Col>
              <Card className="text-center p-5">
                <Card.Body>
                  <Card.Title className="mb-3">Aucune recherche</Card.Title>
                  <Card.Text className="mb-4">
                    Vous n'avez pas encore créé de recherche. Commencez par créer une nouvelle recherche pour trouver des critères publicitaires pertinents.
                  </Card.Text>
                  <Button variant="primary" onClick={startNewSearch}>
                    <FaPlus className="me-2" /> Commencer une recherche
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
                        <th>Nom</th>
                        <th>Description</th>
                        <th>Statut</th>
                        <th>Public cible</th>
                        <th>Date de création</th>
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
                              project.status === 'En cours' ? 'primary' : 
                              project.status === 'Terminé' ? 'success' : 'warning'
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
                                title="Voir les résultats"
                              >
                                <FaSearch />
                              </Button>
                              <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => openEditModal(project)}
                                title="Modifier"
                              >
                                <FaEdit />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => openDeleteModal(project)}
                                title="Supprimer"
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
      
      {/* Modal de création */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nouvelle recherche</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            Créez une nouvelle recherche pour trouver des critères publicitaires pertinents. 
            Après avoir créé la recherche, vous serez redirigé vers le tableau de bord pour 
            sélectionner les catégories et le pays cible.
          </p>
          <ProjectForm onSubmit={handleCreateProject} buttonText="Créer et commencer la recherche" />
        </Modal.Body>
      </Modal>
      
      {/* Modal d'édition */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Modifier la recherche</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProjectForm onSubmit={handleUpdateProject} buttonText="Mettre à jour" />
        </Modal.Body>
      </Modal>
      
      {/* Modal de suppression */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Êtes-vous sûr de vouloir supprimer la recherche "{currentProject.name}" ?</p>
          <p className="text-danger">Cette action est irréversible et supprimera tous les résultats associés.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDeleteProject}>
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Projects; 