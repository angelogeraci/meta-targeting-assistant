import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, InputGroup, Row, Col } from 'react-bootstrap';
import { FaUserPlus, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import AuthContext from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [validated, setValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const { firstName, lastName, email, password, confirmPassword } = formData;
  const { register, loading, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Vérifier si les mots de passe correspondent
    if (e.target.name === 'confirmPassword' || e.target.name === 'password') {
      const passwordValue = e.target.name === 'password' ? e.target.value : password;
      const confirmValue = e.target.name === 'confirmPassword' ? e.target.value : confirmPassword;
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
    
    if (password !== confirmPassword) {
      setPasswordMatch(false);
      return;
    }
    
    const success = await register({ firstName, lastName, email, password });
    if (success) {
      navigate('/dashboard');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-container d-flex align-items-center justify-content-center py-5">
      <Card className="auth-card w-100">
        <Card.Header className="text-center">
          <h4 className="auth-title mb-1"><FaUserPlus className="me-2" /> Inscription</h4>
          <p className="auth-subtitle mb-0">Créez votre compte Meta Targeting Assistant</p>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prénom</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><FaUser /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Votre prénom"
                      name="firstName"
                      value={firstName}
                      onChange={onChange}
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
                      placeholder="Votre nom"
                      name="lastName"
                      value={lastName}
                      onChange={onChange}
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
                  placeholder="Votre adresse e-mail"
                  name="email"
                  value={email}
                  onChange={onChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Veuillez fournir une adresse e-mail valide.
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mot de passe</Form.Label>
              <InputGroup>
                <InputGroup.Text><FaLock /></InputGroup.Text>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Créez un mot de passe"
                  name="password"
                  value={password}
                  onChange={onChange}
                  required
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
              <Form.Text className="text-muted">
                Le mot de passe doit contenir au moins 6 caractères.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Confirmation du mot de passe</Form.Label>
              <InputGroup>
                <InputGroup.Text><FaLock /></InputGroup.Text>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirmez votre mot de passe"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  required
                  isInvalid={validated && !passwordMatch}
                />
                <Form.Control.Feedback type="invalid">
                  Les mots de passe ne correspondent pas.
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              className="btn-auth" 
              disabled={loading}
            >
              {loading ? 'Inscription en cours...' : 'Créer un compte'}
            </Button>
          </Form>

          <div className="auth-footer mt-4">
            <p className="mb-0">
              Vous avez déjà un compte ? <Link to="/login" className="text-decoration-none">Se connecter</Link>
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Register;
