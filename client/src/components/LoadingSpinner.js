import React from 'react';
import { ProgressBar } from 'react-bootstrap';
import { FaSpinner, FaCircleNotch, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

/**
 * Composant d'indicateur de chargement moderne
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

  // Effet de rotation continu pour les icônes
  const spinnerStyle = {
    animation: 'spin 1.5s linear infinite',
  };

  // Définition du keyframe pour l'animation de rotation
  const keyframesStyle = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <div className="loading-container text-center">
      <style>{keyframesStyle}</style>
      
      <div className="mb-4">
        {showProgressBar ? (
          <FaCircleNotch 
            style={spinnerStyle}
            color="var(--primary-color)" 
            size={48} 
          />
        ) : (
          <FaSpinner 
            style={spinnerStyle}
            color="var(--primary-color)" 
            size={48} 
          />
        )}
      </div>
      
      <h5 className="mb-3 fw-semibold">{message || 'Chargement en cours...'}</h5>
      
      {showProgressBar && (
        <div className="my-4 w-100">
          <div className="mb-3 d-flex justify-content-between">
            <span className="text-muted">Progression</span>
            <span className="fw-medium">{progressPercentage}%</span>
          </div>
          
          <ProgressBar 
            animated 
            now={progressPercentage} 
            variant="primary"
            className="mb-3"
            style={{ height: '8px' }}
          />
          
          <div className="text-muted text-start small mt-2">
            <div className="d-flex align-items-center mb-2">
              <FaInfoCircle className="me-2 text-primary" />
              <span>{progress.current} sur {progress.total} critères traités</span>
            </div>
          </div>
          
          {progress.currentItem && (
            <div className="glass-card p-3 mt-3 text-start">
              <div className="small text-muted mb-1">Critère en cours de traitement:</div>
              <div className="fw-medium text-primary">{progress.currentItem}</div>
            </div>
          )}
        </div>
      )}
      
      <p className="text-muted small">
        {showProgressBar 
          ? "Nous analysons les critères pour trouver les meilleures correspondances..."
          : "Cette opération peut prendre quelques minutes selon le nombre de catégories"
        }
      </p>
      
      {progress && progress.status === 'error' && (
        <div className="alert alert-warning d-flex align-items-center mt-3" role="alert">
          <FaExclamationTriangle className="me-2" />
          <div>Une erreur s'est produite lors du traitement. Veuillez réessayer.</div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
