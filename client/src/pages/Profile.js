import React, { useState, useContext } from 'react';
import { Card, Row, Col, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { FaUserEdit, FaLock, FaUser, FaEnvelope, FaCalendarAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import axios from 'axios';
import { toast } from 'react-toastify';

const Profile = () => {
  const { currentUser } = useContext(AuthContext);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Vérifier si les mots de passe correspondent
    if (e.target.name === 'confirmPassword' || e.target.name === 'password') {
      const passwordValue = e.target.name === 'password' ? e.target.value : formData.password;
      const confirmValue = e.target.name === 'confirmPassword' ? e.target.value : formData.confirmPassword;
      setPasswordMatch(passwordValue === confirmValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false || !passwordMatch) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Préparer les données à envoyer (exclure la confirmation du mot de passe)
      const { confirmPassword, ...updateData } = formData;
      
      // Si le mot de passe est vide, ne pas l'inclure dans la mise à jour
      if (!updateData.password) {
        delete updateData.password;
      }
      
      // Appel API pour mettre à jour le profil (à implémenter côté serveur)
      const response = await axios.put('/api/auth/me', updateData);
      
      if (response.data.success) {
        setSuccess('Votre profil a été mis à jour avec succès.');
        toast.success('Profil mis à jour avec succès !');
        setEditMode(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour du profil.');
      toast.error('Erreur lors de la mise à jour du profil.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Mon Profil</h1>
          <p className="text-muted">Gérez vos informations personnelles</p>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaUserEdit className="me-2" />
                  Informations personnelles
                </h5>
                
                {!editMode && (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => setEditMode(true)}
                  >
                    Modifier
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              {editMode ? (
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
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

                  <Form.Group className="mb-3">
                    <Form.Label>Nouveau mot de passe (laisser vide pour ne pas changer)</Form.Label>
                    <InputGroup>
                      <InputGroup.Text><FaLock /></InputGroup.Text>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Nouveau mot de passe"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        minLength="6"
                      />
                      <Button 
                        variant="outline-secondary" 
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                      <Form.Control.Feedback type="invalid">
                        Le mot de passe doit contenir au moins 6 caractères.
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>

                  {formData.password && (
                    <Form.Group className="mb-3">
                      <Form.Label>Confirmer le mot de passe</Form.Label>
                      <InputGroup>
                        <InputGroup.Text><FaLock /></InputGroup.Text>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirmer le mot de passe"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          isInvalid={validated && !passwordMatch}
                        />
                        <Form.Control.Feedback type="invalid">
                          Les mots de passe ne correspondent pas.
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  )}

                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <Button 
                      variant="secondary" 
                      onClick={() => setEditMode(false)}
                    >
                      Annuler
                    </Button>
                    <Button 
                      variant="primary" 
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                </Form>
              ) : (
                <div>
                  <Row className="mb-3">
                    <Col md={4} className="text-muted">Nom complet</Col>
                    <Col md={8} className="fw-medium">{currentUser?.firstName} {currentUser?.lastName}</Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={4} className="text-muted">Adresse e-mail</Col>
                    <Col md={8}>{currentUser?.email}</Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={4} className="text-muted">Rôle</Col>
                    <Col md={8}>
                      <span className={`badge ${currentUser?.role === 'admin' ? 'bg-danger' : 'bg-info'}`}>
                        {currentUser?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                      </span>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={4} className="text-muted">Date d'inscription</Col>
                    <Col md={8}>{formatDate(currentUser?.createdAt)}</Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={4} className="text-muted">Dernière connexion</Col>
                    <Col md={8}>{currentUser?.lastLogin ? formatDate(currentUser.lastLogin) : 'Jamais'}</Col>
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaUser className="me-2" />
                Votre compte
              </h5>
            </Card.Header>
            <Card.Body className="text-center">
              <div className="user-avatar mx-auto mb-3" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}
              </div>
              <h5 className="mb-1">{currentUser?.firstName} {currentUser?.lastName}</h5>
              <p className="text-muted">{currentUser?.email}</p>
              <div className="mt-3">
                <span className={`badge ${currentUser?.role === 'admin' ? 'bg-danger' : 'bg-info'} me-2`}>
                  {currentUser?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                </span>
                <span className="badge bg-success">
                  Actif
                </span>
              </div>
              <div className="mt-4">
                <div className="text-muted mb-2">
                  <FaCalendarAlt className="me-2" />
                  Membre depuis {formatDate(currentUser?.createdAt, { day: 'numeric', month: 'long', year: 'numeric', hour: undefined, minute: undefined })}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Profile;
