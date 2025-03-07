import React from 'react';
import { FaTimes } from 'react-icons/fa';

/**
 * Composant TagFilter moderne pour afficher des tags filtrables
 * 
 * @param {string} label - Texte du tag
 * @param {boolean} active - Si le tag est actuellement actif
 * @param {function} onClick - Fonction appelée lorsque le tag est cliqué
 * @param {boolean} removable - Si le tag peut être supprimé
 * @param {function} onRemove - Fonction appelée lorsque le tag est supprimé
 * @param {string} className - Classes CSS supplémentaires
 */
const FilterTag = ({ 
  label, 
  active = false, 
  onClick, 
  removable = false,
  onRemove,
  className = ''
}) => {
  const handleClick = (e) => {
    if (onClick) onClick(e);
  };
  
  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) onRemove();
  };
  
  return (
    <div 
      className={`filter-tag ${active ? 'active' : ''} ${className}`}
      onClick={handleClick}
    >
      <span>{label}</span>
      
      {removable && (
        <span 
          className="ms-2 filter-tag-remove" 
          onClick={handleRemove}
          role="button"
          aria-label="Supprimer le filtre"
        >
          <FaTimes size={10} />
        </span>
      )}
    </div>
  );
};

export default FilterTag;
