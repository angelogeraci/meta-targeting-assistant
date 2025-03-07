import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import Spinner from 'react-bootstrap/Spinner';

/**
 * Composant pour protéger les routes privées
 * Redirige vers la page de connexion si l'utilisateur n'est pas authentifié
 */
const PrivateRoute = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // Rediriger vers la page de connexion si non authentifié
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
