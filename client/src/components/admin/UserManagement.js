import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, Table, Button, Modal, Form, Badge, 
  InputGroup, Alert, Row, Col, Spinner 
} from 'react-bootstrap';
import { FaUsersCog, FaUserPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import AuthContext from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';

const UserManagement = () => {
  const { getUsers, createUser, updateUser, deleteUser, currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'delete'
  const [selectedUser, setSelectedUser] = useState(null);
  const [validated, setValidated] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user',
    active: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null); // Réinitialiser l'erreur avant de commencer
      const userData = await getUsers();
      
      if (userData && Array.isArray(userData)) {
        setUsers(userData);
      } else {
        console.warn('Format de données utilisateur inattendu:', userData);
        setUsers([]);
        setError('Format de données utilisateur inattendu.');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err);
      setError('Erreur lors de la récupération des utilisateurs. Les données seront chargées si disponibles.');
      // Ne pas bloquer l'affichage des utilisateurs si certains sont déjà chargés
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'user',
      active: true
    });
    setValidated(false);
  };

  const handleModalShow = (type, user = null) => {
    setModalType(type);
    setShowModal(true);
    
    if (user) {
      setSelectedUser(user);
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        role: user.role,
        active: user.active
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (modalType === 'delete') {
      try {
        setLoading(true);
        await deleteUser(selectedUser._id);
        await fetchUsers();
        handleModalClose();
      } catch (err) {
        setError('Une erreur est survenue lors de la suppression.');
        console.error(err);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    const form = document.getElementById('user-form');
    if (!form || form.checkValidity() === false) {
      setValidated(true);
      return;
    }
    
    try {
      setLoading(true);
      
      if (modalType === 'add') {
        await createUser(formData);
      } else if (modalType === 'edit') {
        await updateUser(selectedUser._id, formData);
      }
      
      // Rafraîchir la liste des utilisateurs
      await fetchUsers();
      
      // Fermer le modal
      handleModalClose();
    } catch (err) {
      setError('Une erreur est survenue lors de l\'opération.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Rendu du formulaire d'utilisateur (ajout/modification)
  const renderUserForm = () => (
    <Form id="user-form" noValidate validated={validated} onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Prénom</Form.Label>
            <InputGroup>
              <InputGroup.Text><FaUser /></InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Prénom"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
              <Form.Control.Feedback type="invalid">
                Le prénom est requis.
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Nom</Form.Label>
            <InputGroup>
              <InputGroup.Text><FaUser /></InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Nom"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
              <Form.Control.Feedback type="invalid">
                Le nom est requis.
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Adresse e-mail</Form.Label>
        <InputGroup>
          <InputGroup.Text><FaEnvelope /></InputGroup.Text>
          <Form.Control
            type="email"
            placeholder="Email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <Form.Control.Feedback type="invalid">
            Veuillez fournir une adresse e-mail valide.
          </Form.Control.Feedback>
        </InputGroup>
      </Form.Group>

      {modalType === 'add' && (
        <Form.Group className="mb-3">
          <Form.Label>Mot de passe</Form.Label>
          <InputGroup>
            <InputGroup.Text><FaLock /></InputGroup.Text>
            <Form.Control
              type="password"
              placeholder="Mot de passe"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required={modalType === 'add'}
              minLength="6"
            />
            <Form.Control.Feedback type="invalid">
              Le mot de passe doit contenir au moins 6 caractères.
            </Form.Control.Feedback>
          </InputGroup>
        </Form.Group>
      )}

      <Form.Group className="mb-3">
        <Form.Label>Rôle</Form.Label>
        <Form.Select
          name="role"
          value={formData.role}
          onChange={handleInputChange}
          required
        >
          <option value="user">Utilisateur</option>
          <option value="admin">Administrateur</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="switch"
          id="user-active"
          label="Compte actif"
          name="active"
          checked={formData.active}
          onChange={handleInputChange}
        />
      </Form.Group>
    </Form>
  );

  // Rendu du modal de confirmation de suppression
  const renderDeleteConfirmation = () => (
    <div className="text-center py-3">
      <p className="mb-1">Êtes-vous sûr de vouloir supprimer cet utilisateur ?</p>
      <h5 className="mb-3">{selectedUser?.firstName} {selectedUser?.lastName}</h5>
      <p className="text-muted small">Cette action est irréversible.</p>
    </div>
  );

  // Titre et message d'explication du modal
  const getModalConfig = () => {
    if (modalType === 'add') {
      return {
        title: 'Ajouter un nouvel utilisateur',
        buttonText: 'Ajouter',
        variant: 'primary'
      };
    } else if (modalType === 'edit') {
      return {
        title: 'Modifier un utilisateur',
        buttonText: 'Enregistrer',
        variant: 'primary'
      };
    } else {
      return {
        title: 'Supprimer un utilisateur',
        buttonText: 'Supprimer',
        variant: 'danger'
      };
    }
  };

  const modalConfig = getModalConfig();

  return (
    <div className="admin-dashboard">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaUsersCog className="me-2" />
            Gestion des utilisateurs
          </h5>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => handleModalShow('add')}
          >
            <FaUserPlus className="me-1" /> Ajouter un utilisateur
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {loading && !users.length ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement des utilisateurs...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Dernière connexion</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="user-avatar me-2">
                            {user.initials || user.firstName.charAt(0) + user.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-muted small">Créé le {formatDate(user.createdAt)}</div>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <Badge bg={user.role === 'admin' ? 'danger' : 'info'} className="user-badge">
                          {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                        </Badge>
                      </td>
                      <td>
                        {user.active ? (
                          <Badge bg="success" className="user-badge">
                            <FaCheck className="me-1" /> Actif
                          </Badge>
                        ) : (
                          <Badge bg="secondary" className="user-badge">
                            <FaTimes className="me-1" /> Inactif
                          </Badge>
                        )}
                      </td>
                      <td>{user.lastLogin ? formatDate(user.lastLogin) : 'Jamais'}</td>
                      <td>
                        <div className="user-actions">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => handleModalShow('edit', user)}
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => handleModalShow('delete', user)}
                            disabled={user._id === currentUser?.id}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {users.length === 0 && !loading && (
                    <tr>
                      <td colSpan="6" className="text-center py-3">
                        <p className="mb-0 text-muted">Aucun utilisateur trouvé</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal pour ajouter/modifier/supprimer un utilisateur */}
      <Modal show={showModal} onHide={handleModalClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalConfig.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalType === 'delete' 
            ? renderDeleteConfirmation() 
            : renderUserForm()
          }
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Annuler
          </Button>
          <Button 
            variant={modalConfig.variant} 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Chargement...
              </>
            ) : (
              modalConfig.buttonText
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManagement;
