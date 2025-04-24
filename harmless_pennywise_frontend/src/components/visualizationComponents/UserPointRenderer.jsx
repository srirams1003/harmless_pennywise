import * as d3 from 'd3';
import { getCategoryColor } from '../utils/ColorUtils';
import TooltipManager from './TooltipManager';

/**
 * Handles rendering of the user's point on the chart
 */
const UserPointRenderer = {
  /**
   * Draw user point with enhanced styling and tooltip
   * @param {Object} svg - SVG element
   * @param {number} userPointX - User point X coordinate
   * @param {number} userPointY - User point Y coordinate
   * @param {Function} xScale - X-axis scale function
   * @param {Function} yScale - Y-axis scale function
   * @param {Object} tooltip - Tooltip object
   * @param {number} monthlyIncome - User's monthly income
   * @param {number} monthlySpending - User's monthly spending
   * @param {number} budgetMargin - User's budget margin
   * @param {number} savingsAmount - User's savings amount
   * @param {string} financialCategory - User's financial category
   */
  drawUserPoint(svg, userPointX, userPointY, xScale, yScale, tooltip, monthlyIncome, 
                monthlySpending, budgetMargin, savingsAmount, financialCategory) {
    // user data 
    const userData = {
      monthly_income: monthlyIncome,
      monthly_spending: monthlySpending,
      budget_margin: budgetMargin,
      savings_amount: savingsAmount,
      financial_category: financialCategory
    };
    
    // Add glow effect for user point
    this.addGlowEffect(svg);
    
    // Add a subtle shadow for user point
    svg.append('circle')
      .attr('cx', xScale(userPointX))
      .attr('cy', yScale(userPointY))
      .attr('r', 12)
      .attr('fill', 'rgba(255, 255, 0, 0.3)')
      .style('filter', 'url(#glow)');
    
    // Add user's position with pulsing animation
    const userPoint = this.createUserPoint(svg, userPointX, userPointY, xScale, yScale);
    
    // Add pulsing animation
    this.addPulsingAnimation(userPoint);
    
    // Add interactive tooltip
    this.addTooltipInteraction(userPoint, userData, tooltip, event);
    
    // Add a label to the user point with better styling
    this.addUserLabel(svg, userPointX, userPointY, xScale, yScale);
  },
  
  /**
   * Add glow effect for user point
   * @param {Object} svg - SVG element
   */
  addGlowEffect(svg) {
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
  },
  
  /**
   * Create user point
   * @param {Object} svg - SVG element
   * @param {number} userPointX - User point X coordinate
   * @param {number} userPointY - User point Y coordinate
   * @param {Function} xScale - X-axis scale function
   * @param {Function} yScale - Y-axis scale function
   * @returns {Object} - D3 selection of the user point
   */
  createUserPoint(svg, userPointX, userPointY, xScale, yScale) {
    return svg.append('circle')
      .attr('class', 'user-point')
      .attr('cx', xScale(userPointX))
      .attr('cy', yScale(userPointY))
      .attr('r', 8)
      .attr('fill', 'yellow')
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .style("cursor", "pointer");
  },
  
  /**
   * Add pulsing animation to user point
   * @param {Object} userPoint - D3 selection of the user point
   */
  addPulsingAnimation(userPoint) {
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
  },
  
  /**
   * Add tooltip interaction to user point
   * @param {Object} userPoint - D3 selection of the user point
   * @param {Object} userData - User financial data
   * @param {Object} tooltip - Tooltip object
   */
  addTooltipInteraction(userPoint, userData, tooltip) {
    userPoint
      .on("mouseover", function(event) {
        TooltipManager.showUserTooltip(event, userData, tooltip);
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
  },
  
  /**
   * Add label to user point
   * @param {Object} svg - SVG element
   * @param {number} userPointX - User point X coordinate
   * @param {number} userPointY - User point Y coordinate
   * @param {Function} xScale - X-axis scale function
   * @param {Function} yScale - Y-axis scale function
   */
  addUserLabel(svg, userPointX, userPointY, xScale, yScale) {
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
  }
};

export default UserPointRenderer;