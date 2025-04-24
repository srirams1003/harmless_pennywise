import * as d3 from 'd3';

/**
 * Handles initial chart setup
 */
const ChartSetup = {
  /**
   * Set up the SVG element for the chart
   * @param {Element} svgRef - SVG DOM element reference
   * @param {number} width - Chart width
   * @param {number} height - Chart height
   * @param {Object} margin - Chart margins
   * @returns {Object} - D3 selection of the SVG group element
   */
  setupChart(svgRef, width, height, margin) {
    // Clear any existing chart
    d3.select(svgRef).selectAll('*').remove();
    
    // Add background rect for the entire SVG
    d3.select(svgRef)
      .attr('width', width)
      .attr('height', height)
      .style('background-color', '#1a1a1a')  // Dark background
      .style('border-radius', '12px');       // Rounded corners
    
    // Create SVG
    return d3.select(svgRef)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
  }
};

export default ChartSetup;