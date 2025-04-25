import React, { useState } from 'react';
import { getCategoryColor } from './utils/ColorUtils';

/**
 * Chart Legend Component
 * 
 * @param {Object} props - Component props
 * @param {string} props.financialCategory - Current financial category ('saver', 'balanced', 'overspender')
 * @returns {JSX.Element} - Rendered component
 */
const ChartLegend = ({ financialCategory }) => {
  // State to track if legend is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Toggle expanded/collapsed state
  const toggleLegend = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className={`chart-legend ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Collapsed view - just shows a button */}
      {!isExpanded && (
        <div className="chart-legend-toggle-container">
          <button 
            className="chart-legend-toggle" 
            onClick={toggleLegend}
            aria-label="Expand legend"
          >
            {/* The "i" is created via CSS ::before pseudo-element */}
          </button>
        </div>
      )}
      
      {/* Expanded view - shows full legend */}
      {isExpanded && (
        <div className="chart-legend-content">
          <div className="chart-legend-header">
            <h3>Financial Categories</h3>
            <button 
              className="chart-legend-close" 
              onClick={toggleLegend}
              aria-label="Collapse legend"
            >
              ×
            </button>
          </div>
          
          <div className="chart-legend-items">
            {['Saver', 'Balanced', 'Overspender'].map(category => {
              const categoryLower = category.toLowerCase();
              const isActive = categoryLower === financialCategory;
              
              return (
                <div key={category} className={`chart-legend-item ${isActive ? 'active' : ''}`}>
                  <div className={`chart-legend-color ${categoryLower}`}></div>
                  <div className="chart-legend-label">
                    <span className={`chart-legend-name ${isActive ? 'active' : ''}`}>
                      {category}
                    </span>
                    
                    {isActive && (
                      <span className="chart-legend-subtitle">Your Category</span>
                    )}
                  </div>
                  
                  {isActive && (
                    <div className={`chart-legend-indicator ${categoryLower}`}></div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="chart-legend-footer">
            <p><strong>Saver:</strong> Saves more than peers</p>
            <p><strong>Balanced:</strong> Typical for peer group</p>
            <p><strong>Overspender:</strong> Spends more than peers</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartLegend;