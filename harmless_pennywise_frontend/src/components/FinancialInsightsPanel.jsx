import React from 'react';
import { getCategoryColor } from './utils/ColorUtils';

/**
 * Financial Insights Panel - Displays summary information about the user's finances
 * 
 * @param {Object} props - Component props
 * @param {string} props.financialCategory - User's financial category
 * @param {number} props.monthlyIncome - Monthly income value
 * @param {number} props.monthlySpending - Monthly spending value
 * @param {number} props.budgetMargin - Budget margin value
 * @param {number} props.savingsAmount - Monthly savings amount
 * @returns {JSX.Element} - Rendered component
 */
const FinancialInsightsPanel = ({ 
  financialCategory, 
  monthlyIncome, 
  monthlySpending, 
  budgetMargin, 
  savingsAmount 
}) => {
  
  // Format category name with capital first letter
  const formattedCategory = financialCategory.charAt(0).toUpperCase() + financialCategory.slice(1);
  
  // Check if category and financial reality align
  const categoryWarning = 
    (financialCategory === 'saver' && savingsAmount < 0) || 
    (financialCategory === 'overspender' && savingsAmount > 0);
  
  return (
    <div className="financial-summary">
      <h3 className='app-font'>Financial Summary</h3>
      
      <div className="summary-grid">
        {/* Income Card */}
        <div className="summary-card">
          <div className="summary-label">Monthly Income</div>
          <div className="summary-value">${monthlyIncome.toLocaleString()}</div>
        </div>
        
        {/* Spending Card */}
        <div className="summary-card">
          <div className="summary-label">Monthly Spending</div>
          <div className="summary-value">${monthlySpending.toLocaleString()}</div>
        </div>
        
        {/* Savings Card */}
        <div className="summary-card">
          <div className="summary-label">Monthly Savings</div>
          <div className={`summary-value`} style={{ 
            color: savingsAmount >= 0 ? getCategoryColor('positive') : getCategoryColor('negative') 
          }}>
            {savingsAmount >= 0 ? 
              `$${savingsAmount.toLocaleString()}` : 
              `-$${Math.abs(savingsAmount).toLocaleString()}`}
          </div>
        </div>
        
        {/* Category Card */}
        <div className="summary-card">
          <div className="summary-label">Financial Category</div>
          <div className="summary-value" style={{ color: getCategoryColor(financialCategory) }}>
            {formattedCategory}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default FinancialInsightsPanel;