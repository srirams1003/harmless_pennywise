import * as d3 from 'd3';
import { getCategoryColor } from '../utils/ColorUtils';
import getFinancialCategory from '../utils/getFinancialCategory';
import TooltipManager from './TooltipManager';

/**
 * Handles rendering of data points
 */
const PointRenderer = {
  /**
   * Draw data points on the chart
   * @param {Object} svg - SVG element
   * @param {Object} data - Chart data
   * @param {Function} xScale - X-axis scale function
   * @param {Function} yScale - Y-axis scale function
   * @param {Function} colorScale - Color scale function
   * @param {Object} tooltip - Tooltip object
   * @returns {Object} - The tooltip instance
   */
  drawDataPoints(svg, data, xScale, yScale, colorScale, tooltip) {
    // Map data points and include original point details if available
    const enhancedDataPoints = data.dataset_points.map((d, i) => {
      return {
        x: d[1],                   // Budget margin
        y: d[2],                   // Spending
        category: d[0],            // Financial category
        metrics: data.metrics && i < data.metrics.length ?
                 data.metrics[i] : null,
        details: data.original_points && i < data.original_points.length ? 
                 data.original_points[i] : null,
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
        TooltipManager.showPreview(event, d, this, tooltip, colorScale, data);
      })
      .on("mouseout", function() {
        // Hide tooltip on mouseout unless it's in detailed mode
        if (!TooltipManager.isDetailedMode(tooltip)) {
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
        if (!TooltipManager.isDetailedMode(tooltip)) {
          tooltip
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
        }
      })
      .on("click", function(event, d) {
        // Show detailed tooltip on click
        TooltipManager.showDetailed(event, d, this, tooltip, colorScale, data);
        
        // Prevent event from bubbling to the SVG background
        event.stopPropagation();
      });
        
    // Add click handler to document to dismiss detailed tooltip
    d3.select("body").on("click.dismiss-tooltip", function(event) {
      const tooltipNode = tooltip.node();
      
      // If clicking anywhere other than the tooltip or a data point
      if (tooltipNode && !tooltipNode.contains(event.target) && 
          event.target.tagName.toLowerCase() !== 'circle') {
        // Hide the tooltip and remove detailed mode
        tooltip.style("display", "none")
               .style("pointer-events", "none"); // Ensure pointer events are disabled
        TooltipManager.setDetailedMode(tooltip, false);
          
        // Reset all data points to normal appearance
        svg.selectAll('circle.data-point')
          .transition()
          .duration(200)
          .attr('r', 4)
          .attr('stroke-width', 0.5)
          .attr('stroke-opacity', 0.3);
      }
    });
    
    return tooltip;
  }
};

export default PointRenderer;