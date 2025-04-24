import * as d3 from 'd3';
import { getCategoryColor } from '../utils/ColorUtils';
import getFinancialCategory from '../utils/getFinancialCategory';

/**
 * Manages tooltip functionality and interactions
 */
const TooltipManager = {
  /**
   * Initialize a new tooltip
   * @returns {Object} - The created tooltip
   */
  init() {
    // Remove any existing tooltips first
    d3.selectAll(".financial-tooltip").remove();
    
    // Create new tooltip
    const tooltip = d3.select("body").append("div")
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
      
    return tooltip;
  },
  
  /**
   * Clean up tooltip
   * @param {Object} tooltip - The tooltip to clean up
   */
  cleanup(tooltip) {
    if (tooltip) {
      tooltip.remove();
    }
  },
  
  /**
   * Show preview tooltip on hover
   * @param {Event} event - Mouse event
   * @param {Object} d - Data point
   * @param {Element} element - DOM element 
   * @param {Object} tooltip - Tooltip object
   * @param {Function} colorScale - Color scale function
   * @param {Object} data - Chart data
   */
  showPreview(event, d, element, tooltip, colorScale, data) {
    // Get financial category for this point
    const category = getFinancialCategory(data, d.x, d.y);
    const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
    const savingsAmount = -d.x;

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
        <span class="tooltip-label">Monthly Income:</span>
        <span class="tooltip-value">$${d.details?.monthly_income?.toLocaleString() || 'N/A'}</span>
        <span class="tooltip-label">Total Spending:</span>
        <span class="tooltip-value">${spendingDisplay}</span>
        <span class="tooltip-label">Monthly Savings:</span>
        <span class="tooltip-value" style="color: ${savingsAmount >= 0 ? getCategoryColor('positive') : getCategoryColor('negative')}">
        ${savingsAmount >= 0 ? `$${savingsAmount.toLocaleString()}` : `-$${Math.abs(savingsAmount).toLocaleString()}`}
        </span>
        <span class="tooltip-label">Category:</span>
        <span class="tooltip-value" style="color: ${colorScale(category)};">
          ${formattedCategory}
        </span>
        <span class="tooltip-label">Budget Margin:</span>
        <span class="tooltip-value">${marginDisplay}</span>
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
  },
  
  /**
   * Show detailed tooltip on click
   * @param {Event} event - Mouse event
   * @param {Object} d - Data point
   * @param {Element} element - DOM element
   * @param {Object} tooltip - Tooltip object
   * @param {Function} colorScale - Color scale function 
   * @param {Object} data - Chart data
   */
  showDetailed(event, d, element, tooltip, colorScale, data) {
    // Get financial category for this point
    const category = getFinancialCategory(data, d.x, d.y);
    
    // Build detailed tooltip content
    let tooltipContent = '';
    
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
  },
  
  /**
   * Show user point tooltip
   * @param {Event} event - Mouse event
   * @param {Object} userData - User financial data
   * @param {Object} tooltip - Tooltip object
   */
  showUserTooltip(event, userData, tooltip) {
    const { 
      monthly_income: monthlyIncome, 
      monthly_spending: monthlySpending, 
      budget_margin: budgetMargin, 
      savings_amount: savingsAmount, 
      financial_category: financialCategory 
    } = userData;
    
    const formattedCategory = financialCategory.charAt(0).toUpperCase() + financialCategory.slice(1);
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
          <span class="tooltip-label">Budget Margin:</span>
          <span class="tooltip-value">${budgetMargin >= 0 ? `+$${budgetMargin.toLocaleString()}` : `-$${Math.abs(budgetMargin).toLocaleString()}`}</span>
        </div>
      `)
      .style("left", (event.pageX + 15) + "px")
      .style("top", (event.pageY - 28) + "px");
  }
};

export default TooltipManager;