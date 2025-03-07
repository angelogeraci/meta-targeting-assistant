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
          color="#3498db"
          ariaLabel="chargement en cours"
          visible={true}
        />
      </div>
      <p className="lead">{message || 'Chargement en cours...'}</p>
      
      {showProgressBar && (
        <div className="my-4">
          <ProgressBar 
            animated 
            now={progressPercentage} 
            label={`${progressPercentage}%`} 
            variant="primary"
            className="mb-3"
            style={{ height: '12px', borderRadius: '6px' }}
          />
          
          <div className="bg-light p-3 rounded mt-3">
            <h6 className="mb-2">Détails de progression:</h6>
            <div className="d-flex justify-content-between mb-1">
              <span className="fw-bold">Progression:</span>
              <span className="text-primary">
                {progress.current} sur {progress.total} critères traités
              </span>
            </div>
            
            {progress.currentItem && (
              <div className="d-flex justify-content-between">
                <span className="fw-bold">Critère en cours:</span>
                <span className="text-primary">{progress.currentItem}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <p className="text-muted">
        {showProgressBar 
          ? "Merci de patienter pendant que nous analysons tous les critères"
          : "Cette opération peut prendre quelques minutes en fonction du nombre de catégories sélectionnées"
        }
      </p>
    </div>
  );
};

export default LoadingSpinner;
