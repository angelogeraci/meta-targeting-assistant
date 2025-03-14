import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { FaSignInAlt, FaLock, FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';
import AuthContext from '../../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [validated, setValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { email, password } = formData;
  const { login, loading, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    const success = await login(email, password);
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
          <h4 className="auth-title mb-1"><FaSignInAlt className="me-2" /> Login</h4>
          <p className="auth-subtitle mb-0">Access your Meta Targeting Assistant account</p>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email address</Form.Label>
              <InputGroup>
                <InputGroup.Text><FaEnvelope /></InputGroup.Text>
                <Form.Control
                  type="email"
                  placeholder="Your email address"
                  name="email"
                  value={email}
                  onChange={onChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid email address.
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <Form.Label>Password</Form.Label>
                <Link to="/forgot-password" className="text-decoration-none small">
                  Forgot password?
                </Link>
              </div>
              <InputGroup>
                <InputGroup.Text><FaLock /></InputGroup.Text>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
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
                  Password must be at least 6 characters.
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              className="btn-auth" 
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form>

          <div className="auth-footer mt-4">
            <p className="mb-0">
              Don't have an account? <Link to="/register" className="text-decoration-none">Create an account</Link>
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Login;
