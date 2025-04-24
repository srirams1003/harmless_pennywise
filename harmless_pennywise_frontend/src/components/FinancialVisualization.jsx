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
    // Create tooltip manager instance
    tooltipRef.current = TooltipManager.init();
    
    // Clean up on unmount
    return () => {
      if (tooltipRef.current) {
        TooltipManager.cleanup(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
  }, []);
  
  // Build and render the chart
  useEffect(() => {
    if (!data || !data.dataset_points || !data.dataset_points.length || !svgRef.current || !tooltipRef.current) {
      console.log('Not ready for visualization yet');
      return;
    }
    
    // Render the chart with all its components
    ChartRenderer.render({
      svgRef, 
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