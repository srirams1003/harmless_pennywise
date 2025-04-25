import * as d3 from 'd3';
import { getCategoryColor } from '../utils/ColorUtils';
import getFinancialCategory from '../utils/getFinancialCategory';
import ChartSetup from './ChartSetup';
import BoundaryRenderer from './BoundaryRenderer';
import PointRenderer from './PointRenderer';
import UserPointRenderer from './UserPointRenderer';
import AxesRenderer from './AxesRenderer';

/**
 * Responsible for coordinating the rendering of the chart
 */
const ChartRenderer = {
  /**
   * Render the entire chart
   * @param {Object} params - Parameters for rendering
   */
  render({ svgRef, data, userMetrics, tooltipRef }) {
    // Set up dimensions
    const width = 750;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Validate tooltip
    if (!tooltipRef || !tooltipRef.current) {
      console.warn("Missing tooltip reference in ChartRenderer");
      return;
    }
    
    // Extract user metrics
    const { 
      userPointX, 
      userPointY, 
      monthlyIncome, 
      monthlySpending, 
      budgetMargin, 
      savingsAmount,
      financialCategory
    } = userMetrics;
    
    // Setup chart with enhanced styling
    const svg = ChartSetup.setupChart(svgRef, width, height, margin);
    
    // Validate data before continuing
    if (!data || !data.dataset_points || !data.dataset_points.length) {
      console.warn("Invalid data structure for visualization");
      return;
    }
    
    // Extract data values for scaling
    const dataXValues = data.dataset_points.map(d => d[1]); // budget_margin
    const dataYValues = data.dataset_points.map(d => d[2]); // total_spending
    
    // Create scales
    const { xScale, yScale } = this.createScales(
      dataXValues, 
      dataYValues, 
      userPointX, 
      userPointY, 
      innerWidth, 
      innerHeight
    );
    
    // Create color scale
    const colorScale = this.createColorScale();
    
    // Draw grid first
    this.drawGrid(svg, xScale, yScale, innerWidth, innerHeight);
    
    // Draw boundary regions and lines
    BoundaryRenderer.drawBoundaryAreas(svg, data, xScale, yScale, innerWidth, innerHeight);
    
    // Draw data points
    PointRenderer.drawDataPoints(svg, data, xScale, yScale, colorScale, tooltipRef.current);
    
    // Draw axes
    AxesRenderer.drawAxes(svg, xScale, yScale, innerWidth, innerHeight);
    
    // Draw user point and tooltip last (so it's on top)
    UserPointRenderer.drawUserPoint(
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
  },
  
  /**
   * Create scale functions for the chart
   * @param {Array} dataXValues - X-axis data values
   * @param {Array} dataYValues - Y-axis data values
   * @param {number} userPointX - User point X coordinate
   * @param {number} userPointY - User point Y coordinate
   * @param {number} innerWidth - Chart inner width
   * @param {number} innerHeight - Chart inner height
   * @returns {Object} - Object containing scale functions
   */
  createScales(dataXValues, dataYValues, userPointX, userPointY, innerWidth, innerHeight) {
    // Calculate domain including potential negative values for margin
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
  },
  
  /**
   * Create color scale for financial categories
   * @returns {Function} - D3 color scale function
   */
  createColorScale() {
    return d3.scaleOrdinal()
      .domain(['saver', 'balanced', 'overspender'])
      .range([
        getCategoryColor('saver'),
        getCategoryColor('balanced'),
        getCategoryColor('overspender')
      ]);
  },
  
  /**
   * Draw grid lines on the chart
   * @param {Object} svg - SVG element
   * @param {Function} xScale - X-axis scale function
   * @param {Function} yScale - Y-axis scale function
   * @param {number} innerWidth - Chart inner width
   * @param {number} innerHeight - Chart inner height
   */
  drawGrid(svg, xScale, yScale, innerWidth, innerHeight) {
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
  }
};

export default ChartRenderer;