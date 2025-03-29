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


import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';

const FinancialDashboard = () => {
  // State for storing API data
  const [data, setData] = useState(mockData);
  
  // State for storing user input from sliders
  const [userInputs, setUserInputs] = useState({
    income: 50000,
    spending: 40000,
    savings: 10000,
    debt: 5000
  });
  
  // State for tracking if data is loading
  const [loading, setLoading] = useState(false);
  
  // Reference for the SVG container
  const svgRef = useRef(null);
  
  // Function to fetch data from the backend API
  const fetchData = async () => {
    setLoading(true);
    try {
      // Placeholder for actual API call
      // const response = await fetch('your-api-endpoint', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(userInputs)
      // });
      // const data = await response.json();
      
      // Mock data for development
      
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching data:', error);
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
  
  // Fetch data when user inputs change (debounced to prevent too many requests)
//   useEffect(() => {
//     const debouncedFetch = _.debounce(fetchData, 500);
//     debouncedFetch();
    
//     return () => debouncedFetch.cancel();
//   }, [userInputs]);
  
  // Draw the scatterplot using D3
  useEffect(() => {
    if (!data.dataset_points.length || !svgRef.current) return;
    
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
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([innerHeight, 0]);
    
    // Create color scale
    const colorScale = d3.scaleOrdinal()
      .domain(['saver', 'balanced', 'overspender'])
      .range(['#2ecc71', '#3498db', '#e74c3c']);
    
    // Draw boundary areas
    const drawArea = (points, className) => {
      if (!points || points.length < 3) return;
      
      const lineGenerator = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]));
      
      svg.append('path')
        .datum(points)
        .attr('class', className)
        .attr('d', lineGenerator)
        .attr('fill', className === 'saver-balanced' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)')
        .attr('stroke', className === 'saver-balanced' ? '#2ecc71' : '#e74c3c')
        .attr('stroke-width', 1);
    };
    
    drawArea(data.boundary_coordinates.saver_balanced, 'saver-balanced');
    drawArea(data.boundary_coordinates.balanced_overspender, 'balanced-overspender');
    
    // Draw data points
    svg.selectAll('circle')
      .data(data.dataset_points)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d[1]))
      .attr('cy', d => yScale(d[2]))
      .attr('r', 4)
      .attr('fill', d => colorScale(d[0]))
      .attr('opacity', 0.7)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5);
    
    // Add user's position if available
    if (data.dataset_points.length > 0) {
      const incomeRatio = userInputs.income / (userInputs.income + userInputs.spending);
      const savingsRate = userInputs.savings / userInputs.income;
      const userPoint = ['user', incomeRatio, savingsRate]; // Dynamic user point
      svg.append('circle')
        .attr('cx', xScale(userPoint[1]))
        .attr('cy', yScale(userPoint[2]))
        .attr('r', 8)
        .attr('fill', 'yellow')
        .attr('stroke', '#333')
        .attr('stroke-width', 2);
    }
    
    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    
    svg.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);
    
    svg.append('g')
      .call(yAxis);
    
    // Add axis labels
    svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .text('Income to Spending Ratio');
    
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .text('Savings Rate');
    
    // Add title
    svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .text('Financial Behavior Analysis');
    
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${innerWidth - 120}, 0)`);
    
    const legendItems = ['saver', 'balanced', 'overspender'];
    
    legendItems.forEach((item, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
      
      legendRow.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', colorScale(item));
      
      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 10)
        .attr('text-anchor', 'start')
        .style('text-transform', 'capitalize')
        .text(item);
    });
    
  }, [data, userInputs]);
  
  return (
    <div className="flex flex-col p-4 w-full max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Financial Spending Analysis</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Adjust Your Financial Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2">
              Annual Income: ${userInputs.income.toLocaleString()}
            </label>
            <input
              type="range"
              name="income"
              min="0"
              max="200000"
              step="1000"
              value={userInputs.income}
              onChange={handleSliderChange}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block mb-2">
              Annual Spending: ${userInputs.spending.toLocaleString()}
            </label>
            <input
              type="range"
              name="spending"
              min="0"
              max="200000"
              step="1000"
              value={userInputs.spending}
              onChange={handleSliderChange}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block mb-2">
              Annual Savings: ${userInputs.savings.toLocaleString()}
            </label>
            <input
              type="range"
              name="savings"
              min="0"
              max="100000"
              step="500"
              value={userInputs.savings}
              onChange={handleSliderChange}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block mb-2">
              Current Debt: ${userInputs.debt.toLocaleString()}
            </label>
            <input
              type="range"
              name="debt"
              min="0"
              max="100000"
              step="500"
              value={userInputs.debt}
              onChange={handleSliderChange}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Your Financial Status</h2>
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <p>Loading your financial analysis...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg ref={svgRef}></svg>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg w-full">
              <h3 className="font-semibold mb-2">Key Insights:</h3>
              <ul className="list-disc pl-5">
                <li>Your spending pattern suggests you're in the <strong>{data.dataset_points[0]?.[0] || 'balanced'}</strong> category</li>
                <li>Your savings rate is {Math.round((userInputs.savings / userInputs.income) * 100)}% of your income</li>
                <li>Your debt-to-income ratio is {Math.round((userInputs.debt / userInputs.income) * 100)}%</li>
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
