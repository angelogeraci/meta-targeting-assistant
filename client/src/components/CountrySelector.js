import React from 'react';
import { Form } from 'react-bootstrap';

/**
 * Country selector component
 * @param {Array} countries - List of available countries
 * @param {string} selectedCountry - Selected country code
 * @param {function} onCountryChange - Function called when country changes
 * @param {boolean} disabled - Disables the selector if true
 */
const CountrySelector = ({ countries, selectedCountry, onCountryChange, disabled }) => {
  return (
    <Form.Group className="mb-3">
      <Form.Label>
        <strong>Country</strong>
      </Form.Label>
      <Form.Select
        value={selectedCountry}
        onChange={(e) => onCountryChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Select a country</option>
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </Form.Select>
      <Form.Text className="text-muted">
        Choose the country for which you want suggestions.
      </Form.Text>
    </Form.Group>
  );
};

export default CountrySelector;
