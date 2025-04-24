import React from 'react';
import { getCategoryColor } from './utils/ColorUtils';
import FinancialSlider from './FinancialSlider';

/**
 * Slider group component for organizing sliders by category
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Group title
 * @param {string} props.category - Category for styling and classification
 * @param {Array} props.sliders - Array of slider configuration objects
 * @param {Object} props.userInputs - Current user input values
 * @param {Function} props.handleSliderChange - Change handler function
 * @param {boolean} props.collapsible - Whether the group can be collapsed
 * @param {boolean} props.isOpen - Whether the group is currently open
 * @param {Function} props.setOpen - Function to set which group is open
 * @returns {JSX.Element} - Rendered component
 */
const FinancialSliderGroup = ({ 
  title, 
  category, 
  sliders, 
  userInputs, 
  handleSliderChange,
  collapsible = false,
  isOpen,
  setOpen
}) => {
  const onToggle = () => {
    setOpen(category);
  };
  
  return (
    <div className={`slider-group ${category}-group`}>
      <div className="slider-group-header">
        <h3 className="slider-group-title">
          <span 
            className="category-indicator" 
            style={{ backgroundColor: getCategoryColor(category) }}
          ></span>
          {title}
        </h3>
        
        {collapsible && (
          <button 
            onClick={onToggle} 
            className="collapse-button"
          >
            {isOpen ? "Hide" : "Show"}
          </button>
        )}
      </div>
      
      {isOpen && (
        <div className="slider-group-content">
          {sliders.map(slider => (
            <FinancialSlider
              key={slider.name}
              name={slider.name}
              label={slider.label}
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={userInputs[slider.name]}
              onChange={handleSliderChange}
              category={category}
            />
          ))}
        </div>
      )}
      
      {!isOpen && (
        <div className="slider-group-summary">
          <div className="slider-group-summary-content">
            {sliders.slice(0, 2).map(slider => (
              <div key={slider.name} className="summary-item">
                <span className="summary-label">{slider.label}</span>
                <span className="summary-value">${userInputs[slider.name].toLocaleString()}</span>
              </div>
            ))}
            {sliders.length > 2 && (
              <div className="summary-more">+{sliders.length - 2} more items</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialSliderGroup;