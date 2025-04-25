import * as d3 from 'd3';
import { getCategoryColor } from '../utils/ColorUtils';

/**
 * Handles rendering of boundary areas and lines
 */
const BoundaryRenderer = {
  /**
   * Draw boundary areas on the chart
   * @param {Object} svg - SVG element
   * @param {Object} data - Chart data
   * @param {Function} xScale - X-axis scale function
   * @param {Function} yScale - Y-axis scale function
   * @param {number} innerWidth - Chart inner width
   * @param {number} innerHeight - Chart inner height
   */
  drawBoundaryAreas(svg, data, xScale, yScale, innerWidth, innerHeight) {
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
    
    // Get the boundary lines
    const overspenderCoords = data.boundary_coordinates.saver_balanced;
    const saverCoords = data.boundary_coordinates.balanced_overspender;

    // Extend boundary lines
    const saverBoundary = this.extendBoundaryLine(
      data.boundary_coordinates.saver_balanced, 
      xScale, 
      yScale, 
      innerWidth, 
      innerHeight
    );
    
    const overspenderBoundary = this.extendBoundaryLine(
      data.boundary_coordinates.balanced_overspender, 
      xScale, 
      yScale, 
      innerWidth, 
      innerHeight
    );
    
    if (saverBoundary && overspenderBoundary) {
      // Draw the regions
      this.drawRegions(svg, clipId, xScale, yScale, saverBoundary, overspenderBoundary);
    }
  },
  
  /**
   * Extend boundary lines to chart edges
   * @param {Array} points - Boundary points
   * @param {Function} xScale - X-axis scale function
   * @param {Function} yScale - Y-axis scale function
   * @param {number} innerWidth - Chart inner width
   * @param {number} innerHeight - Chart inner height
   * @returns {Array} - Extended boundary points
   */
  extendBoundaryLine(points, xScale, yScale, innerWidth, innerHeight) {
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
  },
  
  /**
   * Draw financial regions on the chart
   * @param {Object} svg - SVG element
   * @param {string} clipId - Clip path ID
   * @param {Function} xScale - X-axis scale function
   * @param {Function} yScale - Y-axis scale function
   * @param {Array} saverBoundary - Saver boundary points
   * @param {Array} overspenderBoundary - Overspender boundary points
   */
  drawRegions(svg, clipId, xScale, yScale, saverBoundary, overspenderBoundary) {
    // Get chart dimensions in data coordinates
    const xMin = xScale.domain()[0];
    const xMax = xScale.domain()[1];
    const yMin = yScale.domain()[0];
    const yMax = yScale.domain()[1];
    
    // Create a container for regions with clip path applied
    const regionsGroup = svg.append("g")
      .attr("clip-path", `url(#${clipId})`);
    
    // 1. Saver region (green, leftmost)
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
      .attr('fill', getCategoryColor('saver'))
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
      .attr('fill', getCategoryColor('balanced'))
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
      .attr('stroke-dasharray', '5,5');
    
    regionsGroup.append('path')
      .datum(overspenderBoundary)
      .attr('d', d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]))
      )
      .attr('fill', 'none')
      .attr('stroke', getCategoryColor('overspender'))
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');
  }
};

export default BoundaryRenderer;