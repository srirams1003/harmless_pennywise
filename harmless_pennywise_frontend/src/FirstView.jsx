import React, { useState, useEffect, useRef, useContext } from 'react';
import { DataContext } from './context';
import * as d3 from 'd3';
import _ from 'lodash';

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
const calculateFinancialMetrics = (userInputs) => {
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
  
  const spendingRatio = monthlySpending / monthlyIncome;
  const savingsAmount = monthlyIncome - monthlySpending;
  const savingsRate = (savingsAmount / monthlyIncome) * 100;

  // User point coordinates (using monthly values)
  const userPointX = spendingRatio;
  const userPointY = monthlySpending;
  
  return {
    adjustedUserInputs,
    monthlyIncome,
    monthlySpending,
    spendingRatio,
    savingsAmount,
    savingsRate,
    userPointX,
    userPointY
  };
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
  formatValue = value => value.toLocaleString() 
}) => {
  return (
    <div>
      <label className="block mb-2" style={{ color: 'white' }}>
        {label || name}: ${formatValue(value)}
      </label>
      <input
        type="range"
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full"
      />
    </div>
  );
};

// Chart Legend Component
const ChartLegend = ({ financialCategory }) => {
  // Define colors
  const colors = {
    saver: '#2ecc71',
    balanced: '#3498db',
    overspender: '#e74c3c'
  };

  return (
    <div className="chart-legend" style={{ 
      padding: '15px', 
      backgroundColor: 'rgba(0,0,0,0.7)', 
      borderRadius: '5px',
      height: 'fit-content',
      minWidth: '180px',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    }}>
      {/* Legend Title */}
      <h3 style={{ color: 'white', textAlign: 'center', margin: '0 0 10px 0', fontSize: '16px' }}>Financial Categories</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {['Saver', 'Balanced', 'Overspender'].map(category => (
          <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '15px', 
              height: '15px', 
              backgroundColor: colors[category.toLowerCase()],
              border: '1px solid white'
            }}></div>
            <span style={{ color: 'white', fontSize: '12px' }}>{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Financial Sliders Panel
const FinancialSlidersPanel = ({ userInputs, handleSliderChange }) => {
  return (
    <div className="controls-panel">
      <h2 className="text-lg font-semibold mb-4">Adjust Your Financial Details</h2>
      
      {/* Income Group */}
      <div className="slider-group income-group">
        <h3>Income</h3>
        
        <div className="slider-container">
          <div className="slider-header">
            <span className="slider-label">Monthly Income</span>
            <span className="slider-value">${userInputs.monthly_income.toLocaleString()}</span>
          </div>
          <input
            type="range"
            name="monthly_income"
            min="0"
            max="20000"
            step="100"
            value={userInputs.monthly_income}
            onChange={handleSliderChange}
            className="w-full"
          />
        </div>
        
        <div className="slider-container">
          <div className="slider-header">
            <span className="slider-label">Financial Aid</span>
            <span className="slider-value">${userInputs.financial_aid.toLocaleString()}</span>
          </div>
          <input
            type="range"
            name="financial_aid"
            min="0"
            max="20000"
            step="100"
            value={userInputs.financial_aid}
            onChange={handleSliderChange}
            className="w-full"
          />
        </div>
      </div>
      
      {/* Education Group */}
      <div className="slider-group education-group">
        <h3>Education Expenses</h3>
        
        <div className="slider-container">
          <div className="slider-header">
            <span className="slider-label">Tuition</span>
            <span className="slider-value">${userInputs.tuition.toLocaleString()}</span>
          </div>
          <input
            type="range"
            name="tuition"
            min="0"
            max="80000"
            step="1000"
            value={userInputs.tuition}
            onChange={handleSliderChange}
            className="w-full"
          />
        </div>
        
        <div className="slider-container">
          <div className="slider-header">
            <span className="slider-label">Books & Supplies</span>
            <span className="slider-value">${userInputs.books_supplies.toLocaleString()}</span>
          </div>
          <input
            type="range"
            name="books_supplies"
            min="0"
            max="2000"
            step="50"
            value={userInputs.books_supplies}
            onChange={handleSliderChange}
            className="w-full"
          />
        </div>
      </div>
      
      {/* Living Expenses Group */}
      <div className="slider-group living-group">
        <h3>Living Expenses</h3>
        
        <div className="slider-container">
          <div className="slider-header">
            <span className="slider-label">Housing</span>
            <span className="slider-value">${userInputs.housing.toLocaleString()}</span>
          </div>
          <input
            type="range"
            name="housing"
            min="0"
            max="20000"
            step="100"
            value={userInputs.housing}
            onChange={handleSliderChange}
            className="w-full"
          />
        </div>
        
        <div className="slider-container">
          <div className="slider-header">
            <span className="slider-label">Food</span>
            <span className="slider-value">${userInputs.food.toLocaleString()}</span>
          </div>
          <input
            type="range"
            name="food"
            min="0"
            max="2000"
            step="50"
            value={userInputs.food}
            onChange={handleSliderChange}
            className="w-full"
          />
        </div>
        
        <div className="slider-container">
          <div className="slider-header">
            <span className="slider-label">Transportation</span>
            <span className="slider-value">${userInputs.transportation.toLocaleString()}</span>
          </div>
          <input
            type="range"
            name="transportation"
            min="0"
            max="2000"
            step="50"
            value={userInputs.transportation}
            onChange={handleSliderChange}
            className="w-full"
          />
        </div>
      </div>
      
      {/* Personal Expenses Group */}
      <div className="slider-group personal-group">
        <h3>Personal Expenses</h3>
        
        <div className="slider-container">
          <div className="slider-header">
            <span className="slider-label">Entertainment</span>
            <span className="slider-value">${userInputs.entertainment.toLocaleString()}</span>
          </div>
          <input
            type="range"
            name="entertainment"
            min="0"
            max="2000"
            step="50"
            value={userInputs.entertainment}
            onChange={handleSliderChange}
            className="w-full"
          />
        </div>
        
        <div className="slider-container">
          <div className="slider-header">
            <span className="slider-label">Personal Care</span>
            <span className="slider-value">${userInputs.personal_care.toLocaleString()}</span>
          </div>
          <input
            type="range"
            name="personal_care"
            min="0"
            max="2000"
            step="50"
            value={userInputs.personal_care}
            onChange={handleSliderChange}
            className="w-full"
          />
        </div>
        
        <div className="slider-container">
          <div className="slider-header">
            <span className="slider-label">Technology</span>
            <span className="slider-value">${userInputs.technology.toLocaleString()}</span>
          </div>
          <input
            type="range"
            name="technology"
            min="0"
            max="20000"
            step="100"
            value={userInputs.technology}
            onChange={handleSliderChange}
            className="w-full"
          />
        </div>
        
        <div className="slider-container">
          <div className="slider-header">
            <span className="slider-label">Health & Wellness</span>
            <span className="slider-value">${userInputs.health_wellness.toLocaleString()}</span>
          </div>
          <input
            type="range"
            name="health_wellness"
            min="0"
            max="2000"
            step="50"
            value={userInputs.health_wellness}
            onChange={handleSliderChange}
            className="w-full"
          />
        </div>
        
        <div className="slider-container">
          <div className="slider-header">
            <span className="slider-label">Miscellaneous</span>
            <span className="slider-value">${userInputs.miscellaneous.toLocaleString()}</span>
          </div>
          <input
            type="range"
            name="miscellaneous"
            min="0"
            max="2000"
            step="50"
            value={userInputs.miscellaneous}
            onChange={handleSliderChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

// Financial Insights Panel
const FinancialInsightsPanel = ({ financialCategory, monthlyIncome, monthlySpending, spendingRatio, savingsAmount }) => {
  // Define colors based on financial status
  const categoryColors = {
    saver: '#2ecc71',     // Green
    balanced: '#3498db',  // Blue
    overspender: '#e74c3c' // Red
  };
  
  // Determine savings status color
  const savingsColor = savingsAmount >= 0 ? '#2ecc71' : '#e74c3c';
  
  // Determine spending ratio status color (higher ratio = worse)
  const ratioColor = spendingRatio <= 0.7 ? '#2ecc71' : 
                     spendingRatio <= 1.0 ? '#f39c12' : '#e74c3c';
  
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
          <div className={`summary-value ${savingsAmount >= 0 ? 'positive' : 'negative'}`}>
            {savingsAmount >= 0 ? 
              `$${savingsAmount.toLocaleString()}` : 
              `-$${Math.abs(savingsAmount).toLocaleString()}`}
          </div>
        </div>
        
        {/* Category Card */}
        <div className="summary-card">
          <div className="summary-label">Financial Category</div>
          <div className="summary-value" style={{ color: categoryColors[financialCategory] }}>
            {formattedCategory}
          </div>
        </div>
      </div>
      
      {/* Warning Card - Only show if there's a discrepancy */}
      {categoryWarning && (
        <div className="mt-4 bg-yellow-900 rounded-md p-4 border border-yellow-700">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-yellow-500 text-sm">
              {financialCategory === 'saver' 
                ? 'Your spending exceeds your income despite being categorized as a Saver.'
                : 'You have positive savings despite being categorized as an Overspender.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// --------------------------
// DATA VISUALIZATION COMPONENT
// --------------------------
const FinancialVisualization = ({ data, userInputs, financialCategory }) => {
  const svgRef = useRef(null);
  const { userPointX, userPointY, monthlyIncome, monthlySpending, spendingRatio, savingsAmount } = 
    calculateFinancialMetrics(userInputs);
  
  // D3 visualization helpers
  const createTooltip = () => {
    // Remove any previous tooltips
    d3.selectAll(".tooltip").remove();
    
    // Create new tooltip
    // return d3.select("body").append("div")
    //   .attr("class", "tooltip")
    //   .style("position", "absolute")
    //   .style("padding", "10px")
    //   .style("background-color", "rgba(0, 0, 0, 0.8)")
    //   .style("color", "white")
    //   .style("border-radius", "5px")
    //   .style("pointer-events", "none")
    //   .style("font-size", "14px")
    //   .style("z-index", "100000")
    //   .style("opacity", "0")
    //   .style("visibility", "hidden");
    
      return d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "10px")
    .style("background-color", "rgba(0, 0, 0, 0.8)")
    .style("color", "white")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("font-size", "14px")
    .style("z-index", "10000")  // High z-index to ensure visibility
    .style("opacity", 0)        // Start hidden
    .style("display", "none")   // Start hidden with display none
    .style("transition", "opacity 0.2s"); 
  };
  
  const setupChart = (svgRef, width, height, margin) => {
    // Clear any existing chart
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Create SVG
    return d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
  };
  
  const createScales = (dataXValues, dataYValues, userPointX, userPointY, innerWidth, innerHeight) => {
    // Calculate domain
    const xMax = Math.max(...dataXValues, userPointX);
    const yMax = Math.max(...dataYValues, userPointY);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, xMax * 1.1]) // Start from 0, extend 10% beyond max
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([0, yMax * 1.1]) // Start from 0, extend 10% beyond max
      .range([innerHeight, 0]);
      
    return { xScale, yScale };
  };
  
  const createColorScale = () => {
    return d3.scaleOrdinal()
      .domain(['Saver', 'Balanced', 'Over-Spender', 'saver', 'balanced', 'Overspender'])
      .range(['#2ecc71', '#3498db', '#e74c3c', '#2ecc71', '#3498db', '#e74c3c']);
  };
  
  const drawBoundaryLines = (svg, data, xScale, yScale) => {
    // Function to extend a line to the edges of the chart
    const extendLineToBounds = (points) => {
      if (!points || points.length < 2) return points;
      
      // Calculate slope and y-intercept from the two points
      const x1 = points[0][0];
      const y1 = points[0][1];
      const x2 = points[1][0];
      const y2 = points[1][1];
      
      // Calculate slope (m) and y-intercept (b) in y = mx + b
      const slope = (y2 - y1) / (x2 - x1);
      const yIntercept = y1 - (slope * x1);
      
      // Extend the line to the x-axis boundaries
      const xDomainMin = 0;
      const xDomainMax = xScale.domain()[1];
      
      // Calculate y values at domain boundaries
      const yAtXMin = (slope * xDomainMin) + yIntercept;
      const yAtXMax = (slope * xDomainMax) + yIntercept;
      
      // Return extended line points
      return [
        [xDomainMin, yAtXMin],
        [xDomainMax, yAtXMax]
      ];
    };
    
    // Function to draw a decision boundary line
    const drawDecisionBoundary = (points, className, color) => {
      if (!points || points.length < 2) return;
      
      // Extend the line to the chart boundaries
      const extendedPoints = extendLineToBounds(points);
      
      // Draw the boundary line
      const lineGenerator = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]));
      
      // Add the decision boundary line
      svg.append('path')
        .datum(extendedPoints)
        .attr('class', `boundary-line ${className}-line`)
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '8,4');
    };
    
    // Draw boundaries if they exist
    if (data.boundary_coordinates?.saver_balanced && data.boundary_coordinates.saver_balanced.length >= 2) {
      drawDecisionBoundary(
        data.boundary_coordinates.saver_balanced, 
        'saver_balanced', 
        '#2ecc71' // Green color
      );
    }
    
    if (data.boundary_coordinates?.balanced_overspender && data.boundary_coordinates.balanced_overspender.length >= 2) {
      drawDecisionBoundary(
        data.boundary_coordinates.balanced_overspender, 
        'balanced_overspender', 
        '#e74c3c' // Red color
      );
    }
  };
  
  const drawDataPoints = (svg, data, xScale, yScale, colorScale) => {
    svg.selectAll('circle.data-point')
      .data(data.dataset_points)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d[1]))
      .attr('cy', d => yScale(d[2]))
      .attr('r', 4)
      .attr('fill', d => colorScale(d[0]))
      .attr('opacity', 0.7)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5);
  };
  
  const drawUserPoint = (svg, userPointX, userPointY, xScale, yScale, tooltip, monthlyIncome, 
                           monthlySpending, spendingRatio, savingsAmount, financialCategory) => {
    // Define colors for user point based on financial category
    const categoryColors = {
      saver: '#2ecc71',     // Green
      balanced: '#3498db',  // Blue
      overspender: '#e74c3c' // Red
    };
    // Add user's position
    svg.append('circle')
      .attr('class', 'user-point')
      .attr('cx', xScale(userPointX))
      .attr('cy', yScale(userPointY))
      .attr('r', 8)
      .attr('fill', 'yellow')
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .style("cursor", "pointer")
      .on("mouseover", function(event) {
        const formattedCategory = financialCategory.charAt(0).toUpperCase() + financialCategory.slice(1);
        const savingsDisplay = savingsAmount >= 0 ? 
          `$${savingsAmount.toLocaleString()}` : 
          `-$${Math.abs(savingsAmount).toLocaleString()}`;
        // Show tooltip
        tooltip
          .style("display", "block")
          .style("opacity", 1)
          .html(`
            <div style="font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #555; padding-bottom: 5px;">
              Your Financial Data
            </div>
            <div style="display: grid; grid-template-columns: auto auto; gap: 5px; align-items: center;">
              <span>Monthly Income:</span>
              <span style="text-align: right;">$${monthlyIncome.toLocaleString()}</span>
              
              <span>Monthly Spending:</span>
              <span style="text-align: right;">$${monthlySpending.toLocaleString()}</span>
              
              <span>Monthly Savings:</span>
              <span style="text-align: right;">${savingsDisplay}</span>
              
              <span>Category:</span>
              <span style="text-align: right; color: ${categoryColors[financialCategory] || 'white'};">
                ${formattedCategory}
              </span>
            </div>
          `)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        // Hide tooltip
        tooltip
        .style("opacity", 0)
        .style("display", "none");;
      })
      .on("mousemove", function(event) {
        // Move tooltip with mouse
        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      });

    // Add a label to the user point
    svg.append('text')
      .attr('x', xScale(userPointX))
      .attr('y', yScale(userPointY) - 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'white')
      .text('You are here');
  };
  
  const drawAxes = (svg, xScale, yScale, innerWidth, innerHeight) => {
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    
    svg.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('path,line,text')
      .attr('stroke', 'white')
      .attr('fill', 'white');

    svg.append('g')
      .call(yAxis)
      .selectAll('path,line,text')
      .attr('stroke', 'white')
      .attr('fill', 'white');
    
    // Add axis labels
    svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .text('Spending to Income Ratio');
    
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .text('Total Spending (in $)');
  };
  
  const addChartTitle = (svg, innerWidth) => {
    svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .text('Financial Behavior Analysis');
  };
  
  const addBackground = (svg, innerWidth, innerHeight) => {
    svg.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', '#1a1a1a')
      .attr('opacity', 0.2)
      .attr('rx', 5);
  };
  
  // Create the D3 visualization
  useEffect(() => {
    if (!data || !data.dataset_points || !data.dataset_points.length || !svgRef.current) {
      console.log('No data available for visualization or SVG ref not ready');
      return;
    }
    
    // Set up dimensions
    const width = 800;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create tooltip
    const tooltip = createTooltip();
    
    // Setup chart
    const svg = setupChart(svgRef, width, height, margin);
    
    // Extract data values for scaling
    const dataXValues = data.dataset_points.map(d => d[1]); // spending_ratio
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
    
    // Draw background first (so it's in the back)
    addBackground(svg, innerWidth, innerHeight);
    
    // Draw boundary lines
    drawBoundaryLines(svg, data, xScale, yScale);
    
    // Draw data points
    drawDataPoints(svg, data, xScale, yScale, colorScale);
    
    // Draw user point
    drawUserPoint(
      svg, 
      userPointX, 
      userPointY, 
      xScale, 
      yScale, 
      tooltip, 
      monthlyIncome, 
      monthlySpending, 
      spendingRatio, 
      savingsAmount,
      financialCategory
    );
    
    // Draw axes
    drawAxes(svg, xScale, yScale, innerWidth, innerHeight);
    
    // Add chart title
    // addChartTitle(svg, innerWidth);
      
  }, [data, userInputs, financialCategory, userPointX, userPointY, monthlyIncome, monthlySpending, spendingRatio, savingsAmount]);
  
  return (
    <svg ref={svgRef} className="border border-gray-300 bg-gray-800" style={{minHeight: '500px', width: '700px'}}></svg>
  );
};

// --------------------------
// FINANCIAL CATEGORY CLASSIFIER
// --------------------------
const getFinancialCategory = (data, userPointX, userPointY) => {
  // Default to balanced if boundaries aren't available
  if (!data.boundary_coordinates) {
    console.log("No boundary coordinates available");
    return 'balanced';
  }
  
  // Initialize variables to track position relative to boundaries
  let isAboveSaverBalancedLine = false;
  let isAboveBalancedOverspenderLine = false;
  
  // Check position relative to saver_balanced boundary line
  if (data.boundary_coordinates?.saver_balanced && data.boundary_coordinates.saver_balanced.length >= 2) {
    const points = data.boundary_coordinates.saver_balanced;
    
    // Calculate line equation
    const x1 = points[0][0];
    const y1 = points[0][1];
    const x2 = points[1][0];
    const y2 = points[1][1];
    
    const slope = (y2 - y1) / (x2 - x1);
    const yIntercept = y1 - (slope * x1);
    
    // Calculate y value at user's x position
    const boundaryYAtUserX = (slope * userPointX) + yIntercept;
    
    // Check if user is above this line
    isAboveSaverBalancedLine = userPointY > boundaryYAtUserX;
  }
  
  // Check position relative to balanced_overspender boundary line
  if (data.boundary_coordinates?.balanced_overspender && data.boundary_coordinates.balanced_overspender.length >= 2) {
    const points = data.boundary_coordinates.balanced_overspender;
    
    // Calculate line equation
    const x1 = points[0][0];
    const y1 = points[0][1];
    const x2 = points[1][0];
    const y2 = points[1][1];
    
    const slope = (y2 - y1) / (x2 - x1);
    const yIntercept = y1 - (slope * x1);
    
    // Calculate y value at user's x position
    const boundaryYAtUserX = (slope * userPointX) + yIntercept;
    
    // Check if user is above this line
    isAboveBalancedOverspenderLine = userPointY > boundaryYAtUserX;
  }
  
  // REVERSED LOGIC: Determine category based on position relative to both lines
  let category;
  if (isAboveSaverBalancedLine) {
    category = 'saver';  // REVERSED: saver if ABOVE saver_balanced line
  } else if (!isAboveBalancedOverspenderLine) {
    category = 'overspender';  // REVERSED: overspender if BELOW balanced_overspender line
  } else {
    category = 'balanced';  // balanced if between the two lines
  }
  
  return category;
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
const FinancialDashboard = () => {
  // Use our custom data fetching hook
  const { data, loading } = useFinancialData();
  const [userInputs, setUserInputs] = useState(defaultUserInputs);
  const { dataToPlot } = useContext(DataContext);
  const [showControls, setShowControls] = useState(true);
  
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

  // Toggle controls visibility
  const toggleControls = () => {
    setShowControls(!showControls);
  };
  
  // Calculate financial metrics for the user
  const financialMetrics = calculateFinancialMetrics(userInputs);
  
  // Determine financial category
  const financialCategory = getFinancialCategory(
    data, 
    financialMetrics.userPointX, 
    financialMetrics.userPointY
  );
  
  return (
    <div id="first-view-internal-container">
      {/* Toggle button */}
      <button 
        className="toggle-controls" 
        onClick={toggleControls}
        aria-label={showControls ? "Hide controls" : "Show controls"}
      >
        {showControls ? "←" : "→"}
      </button>
      
      {/* Left panel - Visualization */}
      <div className="visualization-panel">
        {/* <h1 className="text-2xl font-bold mb-6">Financial Spending Analysis</h1> */}
        
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <p>Loading your financial analysis...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div className="flex gap-4 w-full justify-center mb-6">
              <FinancialVisualization 
                data={data} 
                userInputs={userInputs} 
                financialCategory={financialCategory} 
              />
              <ChartLegend financialCategory={financialCategory} />
            </div>
            
            <FinancialInsightsPanel 
              financialCategory={financialCategory}
              monthlyIncome={financialMetrics.monthlyIncome}
              monthlySpending={financialMetrics.monthlySpending}
              spendingRatio={financialMetrics.spendingRatio}
              savingsAmount={financialMetrics.savingsAmount}
            />
          </div>
        )}
      </div>
      
      {/* Right panel - Controls (conditionally shown) */}
      {showControls && (
        <FinancialSlidersPanel 
          userInputs={userInputs} 
          handleSliderChange={handleSliderChange}
        />
      )}
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
      <h1 className="text-2xl font-bold mb-6">Financial Spending Analysis</h1>
      <FinancialDashboard />
    </div>
  );
};

export default FirstView;