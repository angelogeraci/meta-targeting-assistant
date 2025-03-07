import React from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { ProgressBar } from 'react-bootstrap';

/**
 * Composant d'indicateur de chargement
 * @param {string} message - Message à afficher pendant le chargement
 * @param {object} progress - Informations de progression (current, total, currentItem)
 */
const LoadingSpinner = ({ message, progress }) => {
  // Calcul du pourcentage de progression
  const calculateProgress = () => {
    if (!progress || !progress.total || progress.total <= 0) return 0;
    return Math.floor((progress.current / progress.total) * 100);
  };

  const progressPercentage = calculateProgress();
  const showProgressBar = progress && progress.total > 0;

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
      
      {showProgressBar && (
        <div className="my-3">
          <ProgressBar 
            animated 
            now={progressPercentage} 
            label={`${progressPercentage}%`} 
            variant="primary"
            className="mb-2"
          />
          
          <p className="text-muted">
            {progress.current} sur {progress.total} critères traités
            {progress.currentItem && (
              <span className="d-block mt-1">
                Élément en cours : <strong>{progress.currentItem}</strong>
              </span>
            )}
          </p>
        </div>
      )}
      
      <p className="text-muted">
        {showProgressBar 
          ? "Merci de patienter pendant que nous analysons tous les critères"
          : "Cette opération peut prendre quelques instants"
        }
      </p>
    </div>
  );
};

export default LoadingSpinner;
