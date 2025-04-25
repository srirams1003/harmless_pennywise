import React from 'react';
import { getCategoryColor } from './utils/ColorUtils';

/**
 * Reusable slider component for financial inputs
 * 
 * @param {Object} props - Component props
 * @param {string} props.name - Slider name (used as id and for form data)
 * @param {number} props.value - Current slider value
 * @param {number} props.min - Minimum slider value
 * @param {number} props.max - Maximum slider value
 * @param {number} props.step - Step increment for slider
 * @param {Function} props.onChange - Change handler function
 * @param {string} props.label - Display label (falls back to name if not provided)
 * @param {string} props.category - Category for styling
 * @param {Function} props.formatValue - Function to format displayed value
 * @returns {JSX.Element} - Rendered component
 */
const FinancialSlider = ({ 
  name, 
  value, 
  min, 
  max, 
  step, 
  onChange, 
  label = null, 
  category = 'default',
  formatValue = value => value.toLocaleString() 
}) => {
  // Use the helper function instead of redefining colors
  const sliderColor = getCategoryColor(category);
  
  return (
    <div className={`slider-container ${category}-group`}>
      <div className="slider-header">
        <span className="slider-label">{label || name}</span>
        <span className="slider-value">${formatValue(value)}</span>
      </div>
      <div className="slider-track-container">
        <input
          type="range"
          name={name}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="slider-input"
          style={{
            '--slider-color': sliderColor,
            '--slider-progress': `${((value - min) / (max - min)) * 100}%`
          }}
        />
        <div 
          className="slider-progress" 
          style={{
            width: `${((value - min) / (max - min)) * 100}%`,
            backgroundColor: sliderColor
          }}
        />
      </div>
      
      <div className="slider-ticks">
        <span className="slider-tick-min">${formatValue(min)}</span>
        <span className="slider-tick-max">${formatValue(max)}</span>
      </div>
    </div>
  );
};

export default FinancialSlider;