import React from 'react';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';

/**
 * Carte métrique moderne pour afficher des statistiques importantes
 * 
 * @param {string} title - Le titre de la métrique
 * @param {string|number} value - La valeur principale à afficher
 * @param {string} unit - Unité optionnelle à afficher après la valeur
 * @param {number} change - Changement en pourcentage (positif ou négatif)
 * @param {string} description - Description supplémentaire
 * @param {React.ReactNode} icon - Icône à afficher
 * @param {string} className - Classes CSS supplémentaires
 */
const MetricCard = ({ 
  title, 
  value, 
  unit = '', 
  change, 
  description,
  icon,
  className = ''
}) => {
  const hasChange = change !== undefined;
  const isPositive = hasChange && change > 0;
  
  return (
    <div className={`metric-card ${className}`}>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <span className="metric-title">{title}</span>
        {icon && <span className="metric-icon">{icon}</span>}
      </div>
      
      <div className="metric-value">
        {value}
        {unit && <span className="metric-unit ms-1">{unit}</span>}
      </div>
      
      {description && <div className="text-muted fs-7 mb-2">{description}</div>}
      
      {hasChange && (
        <div className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <FaChevronUp className="me-1" /> : <FaChevronDown className="me-1" />}
          {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
  );
};

export default MetricCard;
