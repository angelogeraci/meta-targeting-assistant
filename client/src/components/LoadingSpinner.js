import React from 'react';
import { ThreeDots } from 'react-loader-spinner';

/**
 * Composant d'indicateur de chargement
 * @param {string} message - Message à afficher pendant le chargement
 */
const LoadingSpinner = ({ message }) => {
  return (
    <div className="loading-container text-center">
      <div className="mb-3">
        <ThreeDots
          height="80"
          width="80"
          radius="9"
          color="#4267B2"
          ariaLabel="chargement en cours"
          visible={true}
        />
      </div>
      <p className="lead">{message || 'Chargement en cours...'}</p>
      <p className="text-muted">Cette opération peut prendre quelques instants</p>
    </div>
  );
};

export default LoadingSpinner;
