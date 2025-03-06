import React from 'react';
import { Form } from 'react-bootstrap';

/**
 * Composant de sélection de pays
 * @param {Array} countries - Liste des pays disponibles
 * @param {string} selectedCountry - Code du pays sélectionné
 * @param {function} onCountryChange - Fonction appelée lors du changement de pays
 * @param {boolean} disabled - Désactive le sélecteur si true
 */
const CountrySelector = ({ countries, selectedCountry, onCountryChange, disabled }) => {
  return (
    <Form.Group className="mb-3">
      <Form.Label>
        <strong>Pays</strong>
      </Form.Label>
      <Form.Select
        value={selectedCountry}
        onChange={(e) => onCountryChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Sélectionnez un pays</option>
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </Form.Select>
      <Form.Text className="text-muted">
        Choisissez le pays pour lequel vous souhaitez des suggestions.
      </Form.Text>
    </Form.Group>
  );
};

export default CountrySelector;
