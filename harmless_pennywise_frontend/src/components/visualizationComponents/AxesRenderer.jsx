import * as d3 from 'd3';

/**
 * Handles rendering of chart axes
 */
const AxesRenderer = {
  /**
   * Draw axes with better styling
   * @param {Object} svg - SVG element
   * @param {Function} xScale - X-axis scale function
   * @param {Function} yScale - Y-axis scale function
   * @param {number} innerWidth - Chart inner width
   * @param {number} innerHeight - Chart inner height
   */
  drawAxes(svg, xScale, yScale, innerWidth, innerHeight) {
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
    this.addAxisLabels(svg, innerWidth, innerHeight);
  },
  
  /**
   * Add axis labels
   * @param {Object} svg - SVG element
   * @param {number} innerWidth - Chart inner width
   * @param {number} innerHeight - Chart inner height
   */
  addAxisLabels(svg, innerWidth, innerHeight) {
    svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.8)')
      .attr('font-size', '14px')
      .text('Monthly Budget Margin');
    
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.8)')
      .attr('font-size', '14px')
      .text('Total Spending (in $)');
  }
};

export default AxesRenderer;