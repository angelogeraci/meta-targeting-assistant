import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import Spinner from 'react-bootstrap/Spinner';
import { Container, Alert } from 'react-bootstrap';

/**
 * Composant pour protéger les routes réservées aux administrateurs
 * Redirige vers la page de tableau de bord si l'utilisateur n'est pas administrateur
 */
const AdminRoute = () => {
  const { isAdmin, isAuthenticated, loading } = useContext(AuthContext);

  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  // Afficher un message d'erreur si l'utilisateur n'est pas administrateur
  if (!isAdmin()) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Accès refusé</Alert.Heading>
          <p>
            Vous n'avez pas les droits d'administrateur nécessaires pour
            accéder à cette page.
          </p>
        </Alert>
      </Container>
    );
  }

  // Si l'utilisateur est administrateur, afficher le contenu
  return <Outlet />;
};

export default AdminRoute;
