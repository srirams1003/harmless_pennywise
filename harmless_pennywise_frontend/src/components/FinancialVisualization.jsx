import React, { useRef, useEffect } from 'react';
import useCalculateFinancialMetrics from './utils/useCalculateFinancialMetrics';
import TooltipManager from './visualizationComponents/TooltipManager';
import ChartRenderer from './visualizationComponents/ChartRenderer';

/**
 * Financial Visualization Component - Renders D3-based scatter plot with financial data
 * 
 * @param {Object} props - Component props
 * @param {Object} props.data - Dataset containing boundary coordinates and points
 * @param {Object} props.userInputs - User's financial input values
 * @param {string} props.financialCategory - User's financial category
 * @returns {JSX.Element} - Rendered component
 */
const FinancialVisualization = ({ data, userInputs, financialCategory }) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const { metrics } = useCalculateFinancialMetrics(userInputs);
  
  // Extract metrics for easier access
  const { 
    user_point_x: userPointX, 
    user_point_y: userPointY, 
    monthly_income: monthlyIncome, 
    monthly_spending: monthlySpending, 
    budget_margin: budgetMargin, 
    savings_amount: savingsAmount 
  } = metrics;

  // Set up tooltip when component mounts
  useEffect(() => {
    try {
      // Create tooltip manager instance
      if (!tooltipRef.current) {
        tooltipRef.current = TooltipManager.init();
        console.log("Tooltip initialized successfully");
      }
    } catch (error) {
      console.error("Error initializing tooltip:", error);
    }
    
    // Clean up on unmount
    return () => {
      try {
        if (tooltipRef.current) {
          TooltipManager.cleanup(tooltipRef.current);
          tooltipRef.current = null;
        }
      } catch (error) {
        console.error("Error cleaning up tooltip:", error);
      }
    };
  }, []);
  
  // Build and render the chart
  useEffect(() => {
    if (!svgRef.current) {
      console.log('SVG reference not ready yet');
      return;
    }
    
    if (!tooltipRef.current) {
      console.log('Tooltip reference not ready yet');
      return;
    }
    
    if (!data || !data.dataset_points || !data.dataset_points.length) {
      console.log('Data not ready for visualization yet');
      return;
    }
    
    try {
      // Render the chart with all its components
      ChartRenderer.render({
        svgRef: svgRef.current, 
        data, 
        userInputs,
        userMetrics: {
          userPointX,
          userPointY,
          monthlyIncome,
          monthlySpending,
          budgetMargin,
          savingsAmount,
          financialCategory
        },
        tooltipRef
      });
    } catch (error) {
      console.error("Error rendering chart:", error);
    }
    
  }, [data, userInputs, financialCategory, userPointX, userPointY, monthlyIncome, monthlySpending, budgetMargin, savingsAmount]);
  
  return (
    <div className="visualization-container">
      <svg 
        ref={svgRef} 
        className="financial-chart" 
        style={{
          minHeight: '500px', 
          width: '100%', 
          maxWidth: '800px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}
      ></svg>
    </div>
  );
};

export default FinancialVisualization;