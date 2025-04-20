import React, { useState, useEffect, useRef, useContext } from 'react';
import { DataContext } from './context';
import * as d3 from 'd3';
import _, { get } from 'lodash';

// --------------------------
// MOCK DATA
// --------------------------
const mockData = {
  boundary_coordinates: {
    saver_balanced: [[0.1, 0.2], [0.3, 0.5], [0.5, 0.3], [0.1, 0.2]],
    balanced_overspender: [[0.5, 0.3], [0.7, 0.6], [0.9, 0.4], [0.5, 0.3]]
  },
  dataset_points: Array(100).fill().map(() => [
    Math.random() > 0.5 ? 'saver' : Math.random() > 0.5 ? 'balanced' : 'overspender',
    Math.random() * 0.9,
    Math.random() * 0.8
  ]),
  original_points: Array(20).fill().map(() => ({
    income: Math.random() * 100000,
    spending: Math.random() * 80000,
    savings: Math.random() * 20000,
    debt: Math.random() * 15000
  }))
};

// --------------------------
// CONFIGURATION
// --------------------------
// Helper function to get category color
const getCategoryColor = (category) => {
  const categoryColors = {
    // Original categories with new colors
    income: '#4AC29A',      // Soft teal
    education: '#5D87FF',   // Calm blue
    living: '#FF965D',      // Muted orange
    personal: '#B76EFF',    // Soft purple
    
    // Financial status categories
    saver: '#4AC29A',       // Soft teal
    balanced: '#5D87FF',    // Calm blue
    overspender: '#FF5D5D', // Soft red
    
    // Positive and negative indicators
    positive: '#4AC29A',    // Soft teal
    negative: '#FF5D5D',    // Soft red
    
    default: '#5D87FF'      // Default blue
  };
  
  return categoryColors[category] || categoryColors.default;
};
// Slider styles
const sliderConfig = [
  { name: "monthly_income", label: "Monthly Income", min: 0, max: 20000, step: 100 },
  { name: "financial_aid", label: "Financial Aid", min: 0, max: 20000, step: 100 },
  { name: "tuition", label: "Tuition", min: 0, max: 80000, step: 1000 },
  { name: "housing", label: "Housing", min: 0, max: 20000, step: 100 },
  { name: "food", label: "Food", min: 0, max: 2000, step: 50 },
  { name: "transportation", label: "Transportation", min: 0, max: 2000, step: 50 },
  { name: "books_supplies", label: "Books & Supplies", min: 0, max: 2000, step: 50 },
  { name: "entertainment", label: "Entertainment", min: 0, max: 2000, step: 50 },
  { name: "personal_care", label: "Personal Care", min: 0, max: 2000, step: 50 },
  { name: "technology", label: "Technology", min: 0, max: 20000, step: 100 },
  { name: "health_wellness", label: "Health & Wellness", min: 0, max: 2000, step: 50 },
  { name: "miscellaneous", label: "Miscellaneous", min: 0, max: 2000, step: 50 }
];

// Default user inputs
const defaultUserInputs = {
  monthly_income: 1000,  // $12K annually
  financial_aid: 5000,   // Per semester
  tuition: 5000,         // Per semester
  housing: 3600,         // $300/month
  food: 1800,            // $150/month
  transportation: 600,   // $50/month
  books_supplies: 400,   // Per semester
  entertainment: 600,    // $50/month
  personal_care: 480,    // $40/month
  technology: 300,       // Annual
  health_wellness: 480,  // $40/month
  miscellaneous: 360,    // $30/month
};

// --------------------------
// UTILITY FUNCTIONS
// --------------------------
// Improved hook for fetching financial metrics from backend
const useCalculateFinancialMetrics = (userInputs) => {
  const [metrics, setMetrics] = useState({
    // Default fallback values in case the API fails
    monthly_income: 0,
    monthly_spending: 0,
    budget_margin: 0,
    savings_amount: 0,
    savings_rate: 0,
    user_point_x: 0,
    user_point_y: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use local calculation as fallback
  const calculateLocalMetrics = () => {
  // Adjust tuition, financial_aid, and books_supplies by dividing by 4 (semester to monthly)
  const adjustedUserInputs = {...userInputs};
  adjustedUserInputs.tuition = adjustedUserInputs.tuition / 4;
  adjustedUserInputs.financial_aid = adjustedUserInputs.financial_aid / 4;
  adjustedUserInputs.books_supplies = adjustedUserInputs.books_supplies / 4;
  
  const monthlyIncome = userInputs.monthly_income + adjustedUserInputs.financial_aid;
  const monthlySpending = Object.entries(adjustedUserInputs).reduce((sum, [key, value]) => {
    if (key === 'monthly_income' || key === 'financial_aid') {
      return sum;
    }
    // Keep values as monthly
    return sum + value;
  }, 0);
  
    // Changed from ratio to margin (spending minus income)
    const budgetMargin = monthlyIncome - monthlySpending;
  const savingsAmount = monthlyIncome - monthlySpending;
  const savingsRate = (savingsAmount / monthlyIncome) * 100;

  return {
      monthly_income: monthlyIncome,
      monthly_spending: monthlySpending,
      budget_margin: budgetMargin,
      savings_amount: savingsAmount,
      savings_rate: savingsRate,
      user_point_x: budgetMargin,
      user_point_y: monthlySpending
    };
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://localhost:8000/calculate_financial_metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userInputs)
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
          console.log('Received financial metrics from backend:', data);
        } else {
          console.warn(`API response not OK: ${response.status}. Using local calculation.`);
          // Use local calculation as fallback
          const localMetrics = calculateLocalMetrics();
          setMetrics(localMetrics);
        }
      } catch (err) {
        if (!isMounted) return;
        
        console.error('Error fetching financial metrics:', err);
        setError(err.message);
        
        // Use local calculation as fallback
        console.log('Using local calculation as fallback');
        const localMetrics = calculateLocalMetrics();
        setMetrics(localMetrics);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMetrics();

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(userInputs)]); // Stringify to prevent infinite re-renders

  return { metrics, loading, error };
};

// --------------------------
// REUSABLE COMPONENTS
// --------------------------

// Reusable slider component

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

// Slider group component for organizing sliders by category
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
  }
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
            // aria-label={isCollapsed ? "Expand" : "Collapse"}
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


// Chart Legend Component

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


// Financial Insights Panel
const FinancialInsightsPanel = ({ financialCategory, monthlyIncome, monthlySpending, budgetMargin, savingsAmount }) => {
  
  // Format category name with capital first letter
  const formattedCategory = financialCategory.charAt(0).toUpperCase() + financialCategory.slice(1);
  
  // Check if category and financial reality align
  const categoryWarning = 
    (financialCategory === 'saver' && savingsAmount < 0) || 
    (financialCategory === 'overspender' && savingsAmount > 0);
  
  return (
    <div className="financial-summary">
      <h3>Financial Summary</h3>
      
      <div className="summary-grid">
        {/* Income Card */}
        <div className="summary-card">
          <div className="summary-label">Monthly Income</div>
          <div className="summary-value">${monthlyIncome.toLocaleString()}</div>
        </div>
        
        {/* Spending Card */}
        <div className="summary-card">
          <div className="summary-label">Monthly Spending</div>
          <div className="summary-value">${monthlySpending.toLocaleString()}</div>
        </div>
        
        {/* Savings Card */}
        <div className="summary-card">
          <div className="summary-label">Monthly Savings</div>
          <div className={`summary-value`} style={{ color: savingsAmount >= 0 ? getCategoryColor('positive') : getCategoryColor('negative') }}>
            {savingsAmount >= 0 ? 
              `$${savingsAmount.toLocaleString()}` : 
              `-$${Math.abs(savingsAmount).toLocaleString()}`}
          </div>
        </div>
        
        {/* Category Card */}
        <div className="summary-card">
          <div className="summary-label">Financial Category</div>
          <div className="summary-value" style={{ color: getCategoryColor(financialCategory) }}>
            {formattedCategory}
          </div>
        </div>
      </div>
      
    </div>
  );
};

// --------------------------
// DATA VISUALIZATION COMPONENT
// --------------------------
// Enhanced FinancialVisualization component
const FinancialVisualization = ({ data, userInputs, financialCategory }) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const { metrics: { user_point_x: userPointX, user_point_y: userPointY, monthly_income: monthlyIncome, monthly_spending: monthlySpending, budget_margin: budgetMargin, savings_amount: savingsAmount } } = 
    useCalculateFinancialMetrics(userInputs);
  
  // Create tooltip only once when component mounts
  useEffect(() => {
    // Create tooltip if it doesn't exist yet
    if (!tooltipRef.current) {
      // Remove any existing tooltips
      d3.selectAll(".financial-tooltip").remove();
      
      // Create new tooltip
      tooltipRef.current = d3.select("body").append("div")
        .attr("class", "financial-tooltip")
        .style("position", "absolute")
        .style("padding", "12px")
        .style("background-color", "rgba(0, 0, 0, 0.9)")
        .style("color", "white")
        .style("border-radius", "8px")
        .style("pointer-events", "none")
        .style("font-size", "14px")
        .style("z-index", "10000")
        .style("display", "none")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
        .style("border", "1px solid rgba(255,255,255,0.1)");
    }
    
    // Clean up on unmount
    return () => {
      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }
    };
  }, []);
  
  // Set up chart dimensions
  const setupChart = (svgRef, width, height, margin) => {
    // Clear any existing chart
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Add background rect for the entire SVG
    d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('background-color', '#1a1a1a')  // Dark background
      .style('border-radius', '12px');       // Rounded corners
    
    // Create SVG
    return d3.select(svgRef.current)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
  };
  
  // Create scales with better visuals
  const createScales = (dataXValues, dataYValues, userPointX, userPointY, innerWidth, innerHeight) => {
    // Calculate domain including potential negative values for margin
    // const xMin = Math.min(0, ...dataXValues, userPointX); // Include 0 and negative values
    const xMin = Math.min(...dataXValues, userPointX);
    const xMax = Math.max(...dataXValues, userPointX);
    const yMax = Math.max(...dataYValues, userPointY);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([xMin * 1.1, xMax * 1.1]) // Extend domain by 10% on both sides
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([0, yMax * 1.1]) // Start y from 0, extend 10% beyond max
      .range([innerHeight, 0]);
    return { xScale, yScale };
  };
  
  // Create color scale
  const createColorScale = () => {
    return d3.scaleOrdinal()
      .domain(['saver', 'balanced', 'overspender'])
      .range([
        getCategoryColor('saver'),
        getCategoryColor('balanced'),
        getCategoryColor('overspender')
      ]);
  };
  
  // Draw the grid lines
  const drawGrid = (svg, xScale, yScale, innerWidth, innerHeight) => {
    // Add subtle grid lines
    const xGrid = d3.axisBottom(xScale)
      .tickSize(-innerHeight)
      .tickFormat('')
      .ticks(10);
    
    const yGrid = d3.axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat('')
      .ticks(10);
    
    svg.append('g')
      .attr('class', 'x-grid')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xGrid)
      .selectAll('line')
      .attr('stroke', 'rgba(255,255,255,0.1)');
    
    svg.append('g')
      .attr('class', 'y-grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', 'rgba(255,255,255,0.1)');
      
    // Remove the domain lines
    svg.selectAll('.x-grid .domain, .y-grid .domain')
      .attr('stroke', 'none');
  };
  
  const drawBoundaryAreas = (svg, data, xScale, yScale, innerWidth, innerHeight) => {
    if (!data.boundary_coordinates) return;
    
    // Clear any existing regions first to prevent overlap issues
    svg.selectAll('.saver-region, .balanced-region, .overspender-region').remove();
    svg.selectAll('.saver-boundary, .balanced-boundary, .overspender-boundary').remove();
    
    // Add clip path to restrict regions to chart area
    const clipId = "chart-area-clip";
    
    // Remove any existing clip paths
    svg.selectAll(`#${clipId}`).remove();
    
    // Create a clip path for the chart area
    svg.append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("x", 0)
      .attr("y", 0);
    
    // Function to extend the boundary lines to visualization edges
    const extendBoundaryLine = (points, xScale, yScale, innerWidth, innerHeight) => {
      if (!points || points.length < 2) return null;
      
      // Get the first two points to calculate slope
      const p1 = points[0];
      const p2 = points[1];
      
      // Calculate slope and y-intercept
      const slope = (p2[1] - p1[1]) / (p2[0] - p1[0]);
      const yIntercept = p1[1] - (slope * p1[0]);
      
      // Calculate y values at x=0 and x=maxX
      const maxX = xScale.domain()[1];
      const y1 = yIntercept;
      const y2 = (slope * maxX) + yIntercept;
      
      // Return extended points
      return [
        [0, y1],
        [maxX, y2]
      ];
    };
    
    // Get the boundary lines
    const saverBoundary = extendBoundaryLine(
      data.boundary_coordinates.saver_balanced, 
      xScale, 
      yScale, 
      innerWidth, 
      innerHeight
    );
    
    const overspenderBoundary = extendBoundaryLine(
      data.boundary_coordinates.balanced_overspender, 
      xScale, 
      yScale, 
      innerWidth, 
      innerHeight
    );
    
    if (saverBoundary && overspenderBoundary) {
      // Get chart dimensions in data coordinates
      const xMin = xScale.domain()[0];
      const xMax = xScale.domain()[1];
      const yMin = yScale.domain()[0];
      const yMax = yScale.domain()[1];
      
      // Create a container for regions with clip path applied
      const regionsGroup = svg.append("g")
        .attr("clip-path", `url(#${clipId})`);
      
      regionsGroup.append('path')
        .attr('d', `
          M ${xScale(xMin)} ${yScale(yMin)}
          L ${xScale(xMin)} ${yScale(yMax)}
          L ${xScale(saverBoundary[0][0])} ${yScale(saverBoundary[0][1])}
          L ${xScale(saverBoundary[1][0])} ${yScale(saverBoundary[1][1])}
          L ${xScale(xMax)} ${yScale(yMin)}
          L ${xScale(xMin)} ${yScale(yMin)}
          Z
        `)
        .attr('fill', getCategoryColor('saver')) // Explicitly use green
        .attr('fill-opacity', 0.1);
      
      // 2. Balanced region (blue, middle)
      regionsGroup.append('path')
        .attr('d', `
          M ${xScale(saverBoundary[0][0])} ${yScale(saverBoundary[0][1])}
          L ${xScale(overspenderBoundary[1][0])} ${yScale(overspenderBoundary[1][1])}
          L ${xScale(overspenderBoundary[0][0])} ${yScale(overspenderBoundary[0][1])}
          L ${xScale(saverBoundary[1][0])} ${yScale(saverBoundary[1][1])}
          Z
        `)
        .attr('fill', getCategoryColor('balanced')) // Explicitly use blue
        .attr('fill-opacity', 0.1);
      
      // 3. Overspender region (red, rightmost)
      regionsGroup.append('path')
        .attr('d', `
          M ${xScale(overspenderBoundary[0][0])} ${yScale(overspenderBoundary[0][1])}
          L ${xScale(xMax)} ${yScale(yMin)}
          L ${xScale(xMax)} ${yScale(yMax)}
          L ${xScale(overspenderBoundary[1][0])} ${yScale(overspenderBoundary[1][1])}
          Z
        `)
        .attr('fill', getCategoryColor('overspender'))
        .attr('fill-opacity', 0.1);
      
      // Draw boundary lines (also clipped)
      regionsGroup.append('path')
        .datum(saverBoundary)
        .attr('d', d3.line()
          .x(d => xScale(d[0]))
          .y(d => yScale(d[1]))
        )
        .attr('fill', 'none')
        .attr('stroke', getCategoryColor('saver'))
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
      
      regionsGroup.append('path')
        .datum(overspenderBoundary)
        .attr('d', d3.line()
          .x(d => xScale(d[0]))
          .y(d => yScale(d[1]))
        )
        .attr('fill', 'none')
        .attr('stroke', getCategoryColor('overspender'))
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
    }
  };
  
  // Draw data points with enhanced styling
  const drawDataPoints = (svg, data, xScale, yScale, colorScale) => {
    // Create tooltip div if it doesn't exist
    let tooltip = d3.select("body").select(".financial-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body").append("div")
        .attr("class", "financial-tooltip")
        .style("position", "absolute")
        .style("padding", "12px")
        .style("background-color", "rgba(0, 0, 0, 0.9)")
        .style("color", "white")
        .style("border-radius", "8px")
        .style("pointer-events", "auto") // Allow interaction without scrolling
        .style("font-size", "14px")
        .style("z-index", "10000")
        .style("display", "none")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
        .style("border", "1px solid rgba(255,255,255,0.1)")
        .style("max-width", "300px");
    }
  
    // Map data points and include original point details if available
    const enhancedDataPoints = data.dataset_points.map((d, i) => {
      return {
        x: d[1],                   // Budget margin
        y: d[2],                   // Spending
        category: d[0],            // Financial category
        details: data.original_points && i < data.original_points.length ? 
                 data.original_points[i] : null
      };
    });
  
    // Draw all data points
    svg.selectAll('circle.data-point')
      .data(enhancedDataPoints)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 4)
      .attr('fill', d => {
        // Determine financial category from coordinates
        const category = getFinancialCategory(data, d.x, d.y);
        return colorScale(category);
      })
      .attr('opacity', 0.7)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0.3)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        // Show basic preview tooltip on hover
        showPreviewTooltip(event, d, this, tooltip, colorScale, data, xScale, yScale);
      })
      .on("mouseout", function() {
        // Hide tooltip on mouseout unless it's in detailed mode
        if (!tooltip.classed("detailed-mode")) {
          tooltip.style("display", "none");
          
          // Restore point appearance
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 4)
            .attr('stroke-width', 0.5)
            .attr('stroke-opacity', 0.3);
        }
      })
      .on("mousemove", function(event) {
        // Only move tooltip if not in detailed mode
        if (!tooltip.classed("detailed-mode")) {
          tooltip
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
        }
      })
      .on("click", function(event, d) {
        // Show detailed tooltip on click
        showDetailedTooltip(event, d, this, tooltip, colorScale, data, xScale, yScale);
        
        // Mark tooltip as in detailed mode
        tooltip.classed("detailed-mode", true);
        
        // Prevent event from bubbling to the SVG background
        event.stopPropagation();
      });
        
    // Add click handler to document to dismiss detailed tooltip
    d3.select("body").on("click.dismiss-tooltip", function(event) {
      // If clicking anywhere other than the tooltip or a data point
      if (!tooltip.node().contains(event.target) && 
          event.target.tagName.toLowerCase() !== 'circle') {
        // Hide the tooltip and remove detailed mode
        tooltip.style("display", "none")
          .classed("detailed-mode", false);
          
        // Reset all data points to normal appearance
        svg.selectAll('circle.data-point')
          .transition()
          .duration(200)
          .attr('r', 4)
          .attr('stroke-width', 0.5)
          .attr('stroke-opacity', 0.3);
      }
    });
    
    return tooltip; // Return the tooltip for potential use by other components
  };
  
  // Function to show basic preview tooltip on hover
  function showPreviewTooltip(event, d, element, tooltip, colorScale, data, xScale, yScale) {
    // Get financial category for this point
    const category = getFinancialCategory(data, d.x, d.y);
    const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
    
    // Format financial values
    const marginDisplay = d.x >= 0 ? `+$${d.x.toLocaleString()}` : `-$${Math.abs(d.x).toLocaleString()}`;
    const spendingDisplay = `$${d.y.toLocaleString()}`;
  
    // Build basic tooltip content (preview only)
    let tooltipContent = `
      <div class="tooltip-header">
        Data Preview
        <div class="tooltip-hint">(Click for details)</div>
      </div>
      <div class="tooltip-grid">
        <span class="tooltip-label">Category:</span>
        <span class="tooltip-value" style="color: ${colorScale(category)};">
          ${formattedCategory}
        </span>
        <span class="tooltip-label">Budget Margin:</span>
        <span class="tooltip-value">${marginDisplay}</span>
        <span class="tooltip-label">Total Spending:</span>
        <span class="tooltip-value">${spendingDisplay}</span>
      </div>
    `;
  
    // Show tooltip with preview styling
    tooltip
      .classed("detailed-mode", false)
      .style("display", "block")
      .html(tooltipContent)
      .style("left", (event.pageX + 15) + "px")
      .style("top", (event.pageY - 28) + "px");
      
    // Highlight the hovered point
    d3.select(element)
      .transition()
      .duration(200)
      .attr('r', 6)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 1);
  }
  
  // Function to show detailed tooltip on click
  function showDetailedTooltip(event, d, element, tooltip, colorScale, data, xScale, yScale) {
    // Get financial category for this point
    const category = getFinancialCategory(data, d.x, d.y);
    const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
    
    // Format financial values
    const marginDisplay = d.x >= 0 ? `+${d.x.toLocaleString()}` : `-${Math.abs(d.x).toLocaleString()}`;
    const spendingDisplay = `${d.y.toLocaleString()}`;
  
    // Build detailed tooltip content
    let tooltipContent = `
    `;
    
    // Add detailed breakdown if available
    if (d.details) {
      // Add separator
      tooltipContent += `
        <div class="tooltip-header">
          Detailed Breakdown
        </div>
        <div class="tooltip-grid">
      `;
      
      
      // First add priority fields if they exist
      const detailEntries = Object.entries(d.details);
      const ignoredFields = ['preferred_payment_method'];
      const displayedFields = [];
      
      for (const entry of detailEntries) {
        if (!ignoredFields.includes(entry[0])) {
          console.log(entry);
          displayedFields.push(entry);
        }
      }
      
      // Add each selected field to the tooltip
      for (const [key, value] of displayedFields) {
        // Format key for display (capitalize, replace underscores)
        const formattedKey = key
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Determine if value should be displayed as currency or not
        let formattedValue;
        
        // Non-currency fields
        const nonCurrencyFields = ['age', 'major', 'year', 'school', 'gender', 'name', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country'];
        
        // Check if it's a string or a non-currency field
        if (typeof value === 'string' || nonCurrencyFields.includes(key)) {
          formattedValue = value;
        } 
        // Check if it's a small number that might be an age
        else if (key === 'age' || (key.includes('age') && value < 100)) {
          formattedValue = value;
        }
        // Otherwise format as currency
        else {
          formattedValue = `${value.toLocaleString()}`;
        }
          
        tooltipContent += `
          <span class="tooltip-label">${formattedKey}:</span>
          <span class="tooltip-value">${formattedValue}</span>
        `;
      }
      
      // Add a note if there are more fields not shown
      if (Object.keys(d.details).length > displayedFields.length) {
        tooltipContent += `
          <span class="tooltip-note" style="grid-column: span 2; font-size: 11px; color: rgba(255,255,255,0.6); text-align: center; margin-top: 8px;">
            Showing ${displayedFields.length} of ${Object.keys(d.details).length} available fields
          </span>
        `;
      }
      tooltipContent += '</div>';
    }
  
  
    // Show tooltip with detailed styling
    tooltip
      .classed("detailed-mode", true)
      .style("display", "block")
      .html(tooltipContent)
      .style("left", (event.pageX + 15) + "px")
      .style("top", (event.pageY - 28) + "px");
      
    // Highlight the clicked point
    d3.select(element)
      .transition()
      .duration(200)
      .attr('r', 6)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 1);
      
    // Add close button event handler
    tooltip.select(".close-tooltip-btn").on("click", function() {
      // Hide tooltip and remove detailed mode
      tooltip.style("display", "none")
        .classed("detailed-mode", false);
        
      // Reset point appearance
      d3.select(element)
        .transition()
        .duration(200)
        .attr('r', 4)
        .attr('stroke-width', 0.5)
        .attr('stroke-opacity', 0.3);
        
      // Stop propagation to prevent triggering document click
      d3.event ? d3.event.stopPropagation() : event.stopPropagation();
    });
  }
  
  
  // Draw user point with enhanced styling and tooltip
  const drawUserPoint = (svg, userPointX, userPointY, xScale, yScale, tooltip, monthlyIncome, 
                         monthlySpending, budgetMargin, savingsAmount, financialCategory) => {
    // Add glow effect for user point
    const defs = svg.append('defs');
    
    // Add filter for glow effect
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'blur');
    
    filter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');
    
    // Add a subtle shadow for user point
    svg.append('circle')
      .attr('cx', xScale(userPointX))
      .attr('cy', yScale(userPointY))
      .attr('r', 12)
      .attr('fill', 'rgba(255, 255, 0, 0.3)')
      .style('filter', 'url(#glow)');
    
    // Add user's position with pulsing animation
    const userPoint = svg.append('circle')
      .attr('class', 'user-point')
      .attr('cx', xScale(userPointX))
      .attr('cy', yScale(userPointY))
      .attr('r', 8)
      .attr('fill', 'yellow')
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .style("cursor", "pointer");
    
    // Add pulsing animation
    function pulseAnimation() {
      userPoint.transition()
        .duration(1000)
        .attr('r', 10)
        .transition()
        .duration(1000)
        .attr('r', 8)
        .on('end', pulseAnimation);
    }
    
    pulseAnimation();
    
    // Add interactive tooltip
    userPoint
      .on("mouseover", function(event) {
        const formattedCategory = financialCategory.charAt(0).toUpperCase() + financialCategory.slice(1);
        console.log(`Financial Category: ${financialCategory}`);
        const savingsDisplay = savingsAmount >= 0 ? 
          `$${savingsAmount.toLocaleString()}` : 
          `-$${Math.abs(savingsAmount).toLocaleString()}`;
        
        // Show tooltip with enhanced styling
        tooltip
          .style("display", "block")
          .html(`
            <div class="tooltip-header">Your Financial Data</div>
            <div class="tooltip-grid">
              <span class="tooltip-label">Monthly Income:</span>
              <span class="tooltip-value">$${monthlyIncome.toLocaleString()}</span>
              
              <span class="tooltip-label">Monthly Spending:</span>
              <span class="tooltip-value">$${monthlySpending.toLocaleString()}</span>
              
              <span class="tooltip-label">Monthly Savings:</span>
              <span class="tooltip-value" style="color: ${savingsAmount >= 0 ? getCategoryColor('positive') : getCategoryColor('negative')}">
                ${savingsDisplay}
              </span>
              
              <span class="tooltip-label">Category:</span>
              <span class="tooltip-value" style="color: ${getCategoryColor(financialCategory) || 'white'};">
                ${formattedCategory}
              </span>
            </div>
          `)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        // Hide tooltip
        tooltip.style("display", "none");
      })
      .on("mousemove", function(event) {
        // Move tooltip with mouse
        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      });

    // Add a label to the user point with better styling
    svg.append('text')
      .attr('x', xScale(userPointX))
      .attr('y', yScale(userPointY) - 18)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .attr('stroke', 'rgba(0,0,0,0.5)')
      .attr('stroke-width', 3)
      .attr('paint-order', 'stroke')
      .text('You are here');
  };
  
  // Draw axes with better styling
  const drawAxes = (svg, xScale, yScale, innerWidth, innerHeight) => {
    // Create axes with better styling
    const xAxis = d3.axisBottom(xScale)
      .ticks(6)
      .tickSize(6)
      .tickPadding(8)
      .tickFormat(d => {
        // Format ticks to show positive/negative sign for margin
        return d >= 0 ? `+$${d}` : `-$${Math.abs(d)}`;
      });
    
    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickSize(6)
      .tickPadding(8);
    
    // Add x-axis with styling
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .call(g => g.select('.domain').attr('stroke', 'rgba(255,255,255,0.2)'))
      .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.2)'))
      .call(g => g.selectAll('.tick text').attr('fill', 'rgba(255,255,255,0.8)'));

    // Add y-axis with styling
    svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .call(g => g.select('.domain').attr('stroke', 'rgba(255,255,255,0.2)'))
      .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.2)'))
      .call(g => g.selectAll('.tick text').attr('fill', 'rgba(255,255,255,0.8)'));
    
    // Add axis labels with better styling
    svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.8)')
      .attr('font-size', '14px')
      .text('Monthly Budget Margin (Income - Spending)');
    
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.8)')
      .attr('font-size', '14px')
      .text('Total Spending (in $)');
  };
  
  // Create the D3 visualization with enhanced styling
  useEffect(() => {
    if (!data || !data.dataset_points || !data.dataset_points.length || !svgRef.current || !tooltipRef.current) {
      console.log('Not ready for visualization yet');
      return;
    }
    
    // Set up dimensions with better proportions
    const width = 750;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Setup chart with enhanced styling
    const svg = setupChart(svgRef, width, height, margin);
    
    // Extract data values for scaling
    const dataXValues = data.dataset_points.map(d => d[1]); // budget_margin
    const dataYValues = data.dataset_points.map(d => d[2]); // total_spending
    
    // Create scales
    const { xScale, yScale } = createScales(
      dataXValues, 
      dataYValues, 
      userPointX, 
      userPointY, 
      innerWidth, 
      innerHeight
    );
    
    // Create color scale
    const colorScale = createColorScale();
    
    // Draw grid first
    drawGrid(svg, xScale, yScale, innerWidth, innerHeight);
    
    // Draw boundary regions and lines
    drawBoundaryAreas(svg, data, xScale, yScale, innerWidth, innerHeight);
    
    // Draw data points
    drawDataPoints(svg, data, xScale, yScale, colorScale, tooltipRef.current);
    
    // Draw axes
    drawAxes(svg, xScale, yScale, innerWidth, innerHeight);
    
    // Draw user point and tooltip last (so it's on top)
    drawUserPoint(
      svg, 
      userPointX, 
      userPointY, 
      xScale, 
      yScale, 
      tooltipRef.current,
      monthlyIncome, 
      monthlySpending, 
      budgetMargin, 
      savingsAmount,
      financialCategory
    );
  }, [data, userInputs, financialCategory, userPointX, userPointY, monthlyIncome, monthlySpending, budgetMargin, savingsAmount]);
    
  // }, [data, userInputs, financialCategory, userPointX, userPointY, monthlyIncome, monthlySpending, budgetMargin, savingsAmount]);
  
  return (
    <div className="visualization-container">
      <svg 
        ref={svgRef} 
        className="financial-chart" 
        style={{
          minHeight: '500px', 
          width: '100%', 
          maxWidth: '800px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}
      ></svg>
    </div>
  );
};

// --------------------------
// FINANCIAL CATEGORY CLASSIFIER
// --------------------------
const getFinancialCategory = (data, px, py) => {
  if (!data.boundary_coordinates) {
    console.log("No boundary coordinates available");
    return 'balanced';
  }
  
  const pointSide = (p1, p2, px, py) => {
    return (p2[0] - p1[0]) * (py - p1[1]) - (p2[1] - p1[1]) * (px - p1[0]);
  };

  let isBelowSaver = false;
  let isBelowOverspender = false;
  
  // Check against saver_balanced line
  if (data.boundary_coordinates.saver_balanced?.length >= 2) {
    const [p1, p2] = data.boundary_coordinates.saver_balanced;
    const side = pointSide(p1, p2, px, py);
    isBelowSaver = side < 0; 
  }
  
  // Check against balanced_overspender line
  if (data.boundary_coordinates.balanced_overspender?.length >= 2) {
    const [p1, p2] = data.boundary_coordinates.balanced_overspender;
    const side = pointSide(p1, p2, px, py);
    isBelowOverspender = side > 0;
  }
  
  // Decide category
  if (isBelowSaver) return 'saver';
  else if (!isBelowOverspender) return 'overspender';
  else return 'balanced';
};

// --------------------------
// DATA FETCHING HOOK
// --------------------------
const useFinancialData = () => {
  const [data, setData] = useState(mockData);
  const [loading, setLoading] = useState(false);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching initial data from backend...');
      // Call to backend API
      const response = await fetch('http://localhost:8000/initial_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Received data from backend:', responseData);
        
        // Ensure the response data has the expected structure
        if (responseData.boundary_coordinates && 
            responseData.dataset_points && 
            responseData.original_points) {
          setData(responseData);
        } else {
          console.warn('Response data missing expected fields, using mock data');
          setData(mockData);
        }
      } else {
        console.error('API response not OK:', response.status);
        setData(mockData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to mock data on error
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  return { data, loading, fetchData };
};

// --------------------------
// MAIN DASHBOARD COMPONENT
// --------------------------
// Main Financial Dashboard component using the enhanced slider components
const FinancialDashboard = () => {
  // Use our custom data fetching hook
  const { data, loading } = useFinancialData();
  
  // State for storing user input from sliders
  const [userInputs, setUserInputs] = useState(defaultUserInputs);
  
  // State for controlling slider panel visibility
  const [showSliders, setShowSliders] = useState(true);

  // State for accordion panels
  const [accordionStates, setAccordionStates] = useState({
    income: true,
    education: false,
    living: false,
    personal: false
  });
  
  // Add DataContext to access submitted form data
  const { dataToPlot } = useContext(DataContext);
  
  // Update slider values when form data becomes available in context
  useEffect(() => {
    if (dataToPlot && dataToPlot.current_user) {
      console.log('Updating sliders with form data:', dataToPlot.current_user, dataToPlot);
      setUserInputs(prev => ({
        ...prev,
        ...dataToPlot.current_user
      }));
    }
  }, [dataToPlot]);
  
  // Handle slider changes
  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    setUserInputs(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };


  // Simplified reset function - directly uses dataToPlot
  const handleReset = () => {
    if (dataToPlot && dataToPlot.current_user) {
      setUserInputs(prev => ({
        ...prev,
        ...dataToPlot.current_user
      }));
    } else {
      // Fallback to defaultUserInputs if dataToPlot isn't available
      setUserInputs(defaultUserInputs);
    }
  };

  // set Opened state for accordion panels
  const handleAccordionToggle = (category) => {
    setAccordionStates(prev => {
      const newStates = Object.keys(prev).reduce((acc, key) => {
        acc[key] = key === category ? !prev[key] : false;
        return acc;
      }, {});
      return newStates;
    });
  };
  
  // Calculate financial metrics for the user
  const { metrics: financialMetrics, loading: metricsLoading, error: metricsError } = useCalculateFinancialMetrics(userInputs);
  
  // Determine financial category
  const financialCategory = getFinancialCategory(
    data, 
    financialMetrics.user_point_x, 
    financialMetrics.user_point_y
  );
  
  // Toggle sliders visibility
  const toggleSliders = () => {
    setShowSliders(!showSliders);
  };
  
  // Organize sliders into groups
  const sliderGroups = [
    {
      title: "Income",
      category: "income",
      collapsible: true, 
      initialCollapsed: false, 
      sliders: [
        { name: "monthly_income", label: "Monthly Income", min: 0, max: 20000, step: 100 },
        { name: "financial_aid", label: "Financial Aid", min: 0, max: 20000, step: 100 }
      ]
    },
    {
      title: "Education Expenses",
      category: "education",
      collapsible: true,
      initialCollapsed: false,
      sliders: [
        { name: "tuition", label: "Tuition", min: 0, max: 80000, step: 1000 },
        { name: "books_supplies", label: "Books & Supplies", min: 0, max: 2000, step: 50 }
      ]
    },
    {
      title: "Living Expenses",
      category: "living",
      collapsible: true,
      initialCollapsed: true,
      sliders: [
        { name: "housing", label: "Housing", min: 0, max: 20000, step: 100 },
        { name: "food", label: "Food", min: 0, max: 2000, step: 50 },
        { name: "transportation", label: "Transportation", min: 0, max: 2000, step: 50 }
      ]
    },
    {
      title: "Personal Expenses",
      category: "personal",
      collapsible: true,
      initialCollapsed: true,
      sliders: [
        { name: "entertainment", label: "Entertainment", min: 0, max: 2000, step: 50 },
        { name: "personal_care", label: "Personal Care", min: 0, max: 2000, step: 50 },
        { name: "technology", label: "Technology", min: 0, max: 20000, step: 100 },
        { name: "health_wellness", label: "Health & Wellness", min: 0, max: 2000, step: 50 },
        { name: "miscellaneous", label: "Miscellaneous", min: 0, max: 2000, step: 50 }
      ]
    }
  ];
  
  return (
    <div className="financial-dashboard">
      {/* Dashboard container with two-column layout */}
      <div className="dashboard-container">
        {/* Toggle button for sliders panel */}
        <button 
          onClick={toggleSliders}
          className="toggle-sliders-btn"
          aria-label={showSliders ? "Hide controls" : "Show controls"}
        >
          {showSliders ? "→" : "←"}
        </button>
        
        {/* Left panel - Visualization & Summary */}
        <div className={`visualization-panel ${!showSliders ? 'full-width' : ''}`}>
          <h2 className="dashboard-title">Financial Spending Analysis</h2>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading your financial analysis...</p>
            </div>
          ) : (
            <div>
              {/* Chart and Legend layout */}
              <div className="chart-container">
                <FinancialVisualization 
                  data={data} 
                  userInputs={userInputs} 
                  financialCategory={financialCategory} 
                />
                <ChartLegend financialCategory={financialCategory} />
              </div>
              
              {/* Financial Insights Panel */}
              <FinancialInsightsPanel 
                financialCategory={financialCategory}
                monthlyIncome={financialMetrics.monthly_income}
                monthlySpending={financialMetrics.monthly_spending}
                budgetMargin={financialMetrics.budget_margin}
                savingsAmount={financialMetrics.savings_amount}
              />
            </div>
          )}
        </div>
        
        {/* Right panel - Sliders (conditionally rendered) */}
        {showSliders && (
          <div className="sliders-panel">
            <div className="sliders-header">
              <h2 className="sliders-title">Adjust Your Financial Details</h2>
              <button 
                className="reset-btn" 
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
            
            <div className="sliders-content">
              {sliderGroups.map(group => (
                <FinancialSliderGroup
                  key={group.title}
                  title={group.title}
                  category={group.category}
                  sliders={group.sliders}
                  userInputs={userInputs}
                  handleSliderChange={handleSliderChange}
                  collapsible={group.collapsible}
                  // initialCollapsed={group.initialCollapsed}
                  isOpen={accordionStates[group.category]}
                  setOpen={handleAccordionToggle}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// --------------------------
// ENTRY POINT COMPONENT
// --------------------------
const FirstView = () => {
  // Check if input form has been filled yet
  const { dataToPlot } = useContext(DataContext);

  let dataToPlotCopy = {...dataToPlot};

  if (!dataToPlotCopy) return <div>No data available</div>;
  if (!dataToPlotCopy.all_users_average || !dataToPlotCopy.current_user) return <div></div>;

  return (
    <div id="first-view-container">
      <FinancialDashboard />
    </div>
  );
};

export default FirstView;