import React from 'react';
import { Form } from 'react-bootstrap';
import { formatMoney} from '../utils/formatters';

export const MoneyInput = ({ 
  value, 
  onChange, 
  placeholder = "0", 
  readOnly = false,
  className = "",
  ...props 
}) => {
  const handleInputChange = (e) => {
    if (readOnly) return;
    
    let inputValue = e.target.value;
    
    // Allow empty input
    if (inputValue === '') {
      if (onChange) {
        onChange('0', 0);
      }
      return;
    }
    
    // Remove any non-digit characters
    inputValue = inputValue.replace(/[^\d]/g, '');
    
    // Convert to number and format
    const numValue = parseInt(inputValue) || 0;
    const formattedValue = formatMoney(numValue);
    
    // Call onChange with both formatted and raw values
    if (onChange) {
      onChange(formattedValue, numValue);
    }
  };

  const handleFocus = (e) => {
    // Select all text when focused for easy editing
    if (!readOnly) {
      e.target.select();
    }
  };

  const handleBlur = (e) => {
    // Ensure we always have a valid formatted value on blur
    if (!readOnly && (!value || value === '')) {
      if (onChange) {
        onChange('0', 0);
      }
    }
  };

  return (
    <Form.Control
      type="text"
      value={value || '0'}
      onChange={handleInputChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`${className}`}
      {...props}
    />
  );
};
