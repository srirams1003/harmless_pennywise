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


import React, { useState, useEffect, useRef, useContext } from 'react';
import { DataContext } from './context';
import * as d3 from 'd3';
import _ from 'lodash';

// Configuration for all sliders
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
      <label className="block mb-2">
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

// New component for the separated legend
// Simplified component for just the financial categories legend
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
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px'/*justifyContent: 'center', gap: '30px'*/ }}>
        {['Saver', 'Balanced', 'Overspender'].map(category => (
          <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '15px', 
              height: '15px', 
              backgroundColor: colors[category.toLowerCase()],
              border: '1px solid white'
            }}></div>
            <span style={{ color: 'white', fontSize: '12px' }}>{category}</span>
            {/* {financialCategory === category.toLowerCase() && (
              <span style={{ color: 'yellow', marginLeft: '5px' }}>← You are here</span>
            )} */}
          </div>
        ))}
      </div>
    </div>
  );
};

// Component for the sliders section
const FinancialSlidersPanel = ({ userInputs, handleSliderChange }) => {
  return (
    <div className="mb-8 p-4 bg-gray-100 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Adjust Your Financial Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sliderConfig.map(config => (
          <FinancialSlider
            key={config.name}
            name={config.name}
            label={config.label}
            min={config.min}
            max={config.max}
            step={config.step}
            value={userInputs[config.name]}
            onChange={handleSliderChange}
          />
        ))}
      </div>
    </div>
  );
};


const FinancialDashboard = () => {
  // State for storing API data
  const [data, setData] = useState(mockData);

  // Add DataContext to access submitted form data
  const { dataToPlot } = useContext(DataContext);
  
  // State for storing user input from sliders - much lower values to match dataset
  const [userInputs, setUserInputs] = useState({
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
  });
  
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

  // // Ensure userInputs are within the slider limits
  // useEffect(() => {
  //   setUserInputs(prev => {
  //     const updatedInputs = { ...prev };
  //     sliderConfig.forEach(config => {
  //       const value = updatedInputs[config.name];
  //       if (value < config.min) {
  //         updatedInputs[config.name] = config.min;
  //       } else if (value > config.max) {
  //         updatedInputs[config.name] = config.max;
  //       }
  //     });
  //     return updatedInputs;
  //   });
  // }, [userInputs, sliderConfig]);

  // State for tracking if data is loading
  const [loading, setLoading] = useState(false);
  
  // Reference for the SVG container
  const svgRef = useRef(null);
  
  // Function to fetch data from the backend API
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
  
  // Handle slider changes
  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    setUserInputs(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };
  // Calculate financial metrics for use throughout the component
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
	const userPointY = monthlySpending;
	const userPointX = spendingRatio;
  
  // Determine financial category based on boundary lines
const getFinancialCategory = () => {
  // Default to balanced if boundaries aren't available
  if (!data.boundary_coordinates) {
    console.log("No boundary coordinates available");
    return 'balanced';
  }
  
  console.log("User position:", { userPointX, userPointY });
  console.log("Boundary coordinates:", data.boundary_coordinates);
  
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
    
    console.log("saver_balanced boundary:", { 
      points,
      slope, 
      yIntercept, 
      boundaryYAtUserX,
      userPointY,
      isAboveLine: userPointY > boundaryYAtUserX
    });
    
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
    
    console.log("balanced_overspender boundary:", { 
      points,
      slope, 
      yIntercept, 
      boundaryYAtUserX,
      userPointY,
      isAboveLine: userPointY > boundaryYAtUserX
    });
    
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
    category = 'balanced';  // balanced if between the two lines (below saver_balanced, above balanced_overspender)
  }
  
  console.log("Final classification:", {
    isAboveSaverBalancedLine,
    isAboveBalancedOverspenderLine,
    category
  });
  
  return category;
};

  const financialCategory = getFinancialCategory();
  
  // Fetch initial data when component mounts
  useEffect(() => {
    fetchData();
  }, []);
  
  // Update visualization when user inputs change
  useEffect(() => {
    if (data && data.dataset_points && data.dataset_points.length > 0) {
      // No need to fetch again, just redraw the visualization
      console.log('User inputs changed, updating visualization');
    }
  }, [userInputs]);
  
  // Draw the scatterplot using D3
  useEffect(() => {
    d3.selectAll(".tooltip").remove();
    // const tooltip = d3.select("body")
    //   .append("div")
    //   .attr("class", "tooltip")
    //   .style("position", "absolute")
    //   .style("background-color", "rgba(0, 0, 0, 0.8)")
    //   .style("color", "white")
    //   .style("padding", "10px")
    //   .style("border-radius", "5px")
    //   .style("font-size", "14px")
    //   .style("pointer-events", "none")
    //   .style("opacity", 0);

    const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background-color", "rgba(0, 0, 0, 0.8)")
  .style("color", "white")
  .style("padding", "10px")
  .style("border-radius", "5px")
  .style("font-size", "14px")
  .style("pointer-events", "none")
  .style("z-index", "99999")  // Make sure it's on top
  .style("opacity", 1);

    if (!data || !data.dataset_points || !data.dataset_points.length || !svgRef.current) {
      console.log('No data available for visualization or SVG ref not ready');
      return;
    }
    
    console.log('Drawing visualization with data:', data);
    
    // Clear any existing chart
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Set up dimensions
    const width = 800;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
	

	// Log actual data points for debugging
	console.log('Dataset points format:', data.dataset_points.slice(0, 3));
	
	// Extract x and y values properly from data points for scaling
	const dataXValues = data.dataset_points.map(d => d[1]); // spending_ratio (index 1)
	const dataYValues = data.dataset_points.map(d => d[2]); // total_spending (index 2)
	
	// Calculate statistics about data
	const avgX = dataXValues.reduce((sum, val) => sum + val, 0) / dataXValues.length;
	const avgY = dataYValues.reduce((sum, val) => sum + val, 0) / dataYValues.length;
	
	console.log('X values range:', Math.min(...dataXValues).toFixed(2), 'to', Math.max(...dataXValues).toFixed(2), 'avg:', avgX.toFixed(2));
	console.log('Y values range:', Math.min(...dataYValues).toFixed(2), 'to', Math.max(...dataYValues).toFixed(2), 'avg:', avgY.toFixed(2));
	console.log('User spending ratio:', userPointX.toFixed(2), 'User total spending:', userPointY.toFixed(2));
	
	// Create domain that includes the user point and actual data
	const xMin = Math.min(...dataXValues, userPointX);
	const xMax = Math.max(...dataXValues, userPointX);
	const yMin = Math.min(...dataYValues, userPointY);
	const yMax = Math.max(...dataYValues, userPointY);

	
	// Create scales with a small buffer
	const xScale = d3.scaleLinear()
		.domain([0, xMax * 1.1]) // Start from 0, extend 10% beyond max
		.range([0, innerWidth]);
	
	const yScale = d3.scaleLinear()
		.domain([0, yMax * 1.1]) // Start from 0, extend 10% beyond max
		.range([innerHeight, 0]);

    // Create color scale - match backend categories (case sensitive)
    const colorScale = d3.scaleOrdinal()
      .domain(['Saver', 'Balanced', 'Over-Spender', 'saver', 'balanced', 'Overspender'])
      .range(['#2ecc71', '#3498db', '#e74c3c', '#2ecc71', '#3498db', '#e74c3c']);

    const drawLinearBoundaries = () => {
      // Function to extend a line to the edges of the chart
      // console.log("data is ", data)
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
        
        // Extend the line to the x-axis boundaries of our chart
        // Get the x domain min and max from our scale
        const xDomainMin = 0; // We're using 0 as the minimum
        const xDomainMax = xScale.domain()[1]; // Maximum value from our scale
        
        // Calculate y values at domain boundaries
        const yAtXMin = (slope * xDomainMin) + yIntercept;
        const yAtXMax = (slope * xDomainMax) + yIntercept;
        
        // Return extended line points
        return [
          [xDomainMin, yAtXMin],
          [xDomainMax, yAtXMax]
        ];
      };
      
      // Function to draw a decision boundary line with shaded regions
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
        
        // Add a label for the boundary
        const labelPoint = extendedPoints[1]; // Use the right end of the line
        svg.append('text')
          .attr('x', xScale(labelPoint[0]) - 60) // Offset to the left 
          .attr('y', yScale(labelPoint[1]) - 10) // Offset above
          .attr('text-anchor', 'end')
          .attr('font-size', '11px')
          .attr('fill', 'white')
          .attr('stroke', color)
          .attr('stroke-width', 0.5)
          .attr('paint-order', 'stroke')
          .text(className.replace('_', '/').toUpperCase());
      };
      
      // Draw each boundary with appropriate styling
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
      
      // Define the regions based on the boundaries
      // Calculate approximate centers for region labels
      // These need to be dynamically calculated based on the boundaries
      const regions = [
        { name: 'Saver', position: [0.3, 0.2], color: '#2ecc71' },
        { name: 'Balanced', position: [0.6, 0.4], color: '#3498db' },
        { name: 'Overspender', position: [0.9, 0.6], color: '#e74c3c' }
      ];
      
      // Add region labels
      regions.forEach(region => {
        svg.append('text')
          .attr('class', `region-label ${region.name.toLowerCase()}-region`)
          .attr('x', xScale(region.position[0]))
          .attr('y', yScale(region.position[1]))
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('font-weight', 'bold')
          .attr('font-size', '16px')
          .attr('stroke', region.color)
          .attr('stroke-width', 0.5)
          .attr('paint-order', 'stroke')
          .text(region.name);
      });
    };
    drawLinearBoundaries();
    
    // Draw data points
    svg.selectAll('circle.data-point')
      .data(data.dataset_points)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d[1])) // This was reversed - x should be spending ratio (index 1)
      .attr('cy', d => yScale(d[2])) // y should be total spending (index 2)
      .attr('r', 4)
      .attr('fill', d => colorScale(d[0]))
      .attr('opacity', 0.7)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5);
    
    // Add user's position if available
    if (data.dataset_points.length > 0) {
    //   const totalIncome = userInputs.monthly_income * 12 + userInputs.financial_aid;
    //   const totalSpending = Object.entries(userInputs).reduce((sum, [key, value]) => {
    //     return key === 'monthly_income' || key === 'financial_aid' ? sum : sum + value;
    //   }, 0);
    //   const spendingRatio = totalSpending / totalIncome;
    //   const userPoint = ['user', totalSpending / 100000, spendingRatio]; // Dynamic user point
      svg.append('circle')
		.attr('class', 'user-point')
		.attr('cx', xScale(userPointX))
		.attr('cy', yScale(userPointY))
		.attr('r', 8)
		.attr('fill', 'yellow')
		.attr('stroke', '#333')
		.attr('stroke-width', 2);

	// Add a pulsing animation to make user point stand out
	const userPoint = svg.append('circle')
		.attr('class', 'user-point-pulse')
		.attr('cx', xScale(userPointX))
		.attr('cy', yScale(userPointY))
		.attr('r', 8)
		.attr('fill', 'rgba(255, 255, 0, 0.3)')
		.attr('stroke', 'yellow')
		.attr('stroke-width', 1);
  
    // svg.select(".user-point")
    // .style("cursor", "pointer")
    // .on("mouseover", function(event) {
    //   // Show tooltip on hover
    //   tooltip.transition()
    //     .duration(200)
    //     .style("opacity", 0.9);
        
    //   // Format the tooltip content
    //   const tooltipContent = `
    //     <strong>Your Financial Data:</strong><br>
    //     Monthly Income: $${monthlyIncome.toLocaleString()}<br>
    //     Monthly Spending: $${monthlySpending.toLocaleString()}<br>
    //     Spending Ratio: ${spendingRatio.toFixed(2)}<br>
    //     Savings: $${savingsAmount.toLocaleString()}<br>
    //     Savings Rate: ${savingsRate.toFixed(1)}%<br>
    //     Category: ${financialCategory.charAt(0).toUpperCase() + financialCategory.slice(1)}
    //   `;
      
    //   tooltip.html(tooltipContent)
    //     .style("left", (event.pageX + 15) + "px")
    //     .style("top", (event.pageY - 28) + "px");
    // })
    // .on("mouseout", function() {
    //   // Hide tooltip when not hovering
    //   tooltip.transition()
    //     .duration(500)
    //     .style("opacity", 0);
    // });

    userPoint
    .style("cursor", "pointer")
    .on("mouseover", function(event) {
      // Change the circle's appearance to verify event is firing
      console.log("User point hovered");
      d3.select(this)
        .attr("fill", "red")
        .attr("r", 10);
        
      // Show tooltip
      tooltip.transition()
        .duration(200)
        .style("opacity", 0.9);
      
      // Format tooltip content
      const tooltipContent = `
        <strong>Your Financial Data:</strong><br>
        Monthly Income: $${monthlyIncome.toLocaleString()}<br>
        Monthly Spending: $${monthlySpending.toLocaleString()}<br>
        Spending Ratio: ${spendingRatio.toFixed(2)}<br>
        Savings: $${savingsAmount.toLocaleString()}<br>
        Savings Rate: ${savingsRate.toFixed(1)}%<br>
        Category: ${financialCategory.charAt(0).toUpperCase() + financialCategory.slice(1)}
      `;
      
      tooltip.html(tooltipContent)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      // Restore original appearance
      d3.select(this)
        .attr("fill", "yellow")
        .attr("r", 8);
        
      // Hide tooltip
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });

	// Add a label to the user point
	svg.append('text')
		.attr('x', xScale(userPointX))
		.attr('y', yScale(userPointY) - 15)
		.attr('text-anchor', 'middle')
		.attr('font-size', '12px')
		.attr('fill', 'white')
		.text('You are here');
    }
    
    // Add axes
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
      .attr('fill', 'white') // Add this
      .text('Spending to Income Ratio');
    
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white') // Add this
      .text('Total Spending (in $)');
    
    // Add title
	svg.append('text')
	  .attr('x', innerWidth / 2)
	  .attr('y', -20)
	  .attr('text-anchor', 'middle')
	  .attr('font-size', '20px')
	  .attr('font-weight', 'bold')
	  .attr('fill', 'white')
	  .text('Financial Behavior Analysis');
    
    // Add legend

svg.append('rect')
.attr('width', innerWidth)
.attr('height', innerHeight)
.attr('fill', '#1a1a1a')
.attr('opacity', 0.2)
.attr('rx', 5);

    
  }, [data, userInputs]);
  
  return (
    <div className="flex flex-col p-4 w-full max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Financial Spending Analysis</h1>
      
      <FinancialSlidersPanel 
        userInputs={userInputs} 
        handleSliderChange={handleSliderChange}
      />
      
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Your Financial Status</h2>
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <p>Loading your financial analysis...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'center' }}>
              <svg ref={svgRef} className="border border-gray-300 bg-gray-800" style={{minHeight: '500px', width: '700px'}}></svg>
              
              <ChartLegend financialCategory={financialCategory} />
            </div>
            {/* <div id="legend-container" style="margin-left: 20px;"></div> */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg w-full">
  <h3 className="font-semibold mb-2">Key Insights:</h3>
  <ul className="list-disc pl-5">
    <li>Your spending pattern suggests you're in the <strong className={`${
      financialCategory === 'saver' ? 'text-green-600' : 
      financialCategory === 'balanced' ? 'text-blue-600' : 'text-red-600'
    }`}>{financialCategory.charAt(0).toUpperCase() + financialCategory.slice(1)}</strong> category</li>
    <li>Your total monthly income: <strong>${monthlyIncome.toLocaleString()}</strong></li>
    <li>Your total monthly spending: <strong>${monthlySpending.toLocaleString()}</strong></li>
    <li>Your spending ratio: <strong>{spendingRatio.toFixed(2)}x</strong> your income</li>
    <li>Your savings amount: <strong>${savingsAmount.toLocaleString()}</strong></li>
  </ul>
</div>
          </div>
        )}
      </div>
      
      {/* Second view - Bar graph for spending categories would go here */}
      {/* <SpendingCategoriesBarChart /> */}
    </div>
  );
};

// export default FinancialDashboard;

const FirstView = () => {
	return (
		<div style={{ border: '2px solid green', padding: '10px', margin: '10px' }}>
			<h2>First View Component</h2>
			<p>This is a placeholder for the first view </p>
			{/* <ScatterPlot data={mockData} /> */}
			<FinancialDashboard />
		</div>
	);
};

export default FirstView;
