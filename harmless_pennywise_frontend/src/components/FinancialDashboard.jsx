import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../context';
import getFinancialCategory from './utils/getFinancialCategory';
import useCalculateFinancialMetrics from './utils/useCalculateFinancialMetrics';
import useFinancialData from './utils/useFinancialData';
import FinancialSliderGroup from './FinancialSliderGroup';
import FinancialVisualization from './FinancialVisualization';
import ChartLegend from './ChartLegend';
import FinancialInsightsPanel from './FinancialInsightsPanel';

// Default user inputs
const defaultUserInputs = {
  monthly_income: 1000,  // $12K annually
  financial_aid: 5000,   // Per semester
  tuition: 5000,         // Per semester
  housing: 3600,         // $300/month
  food: 1800,            // $150/month
  transportation: 600,   // $50/month
  books_supplies: 400,   // Per semester
  entertainment: 600,    // $50/month
  personal_care: 480,    // $40/month
  technology: 300,       // Annual
  health_wellness: 480,  // $40/month
  miscellaneous: 360,    // $30/month
};

/**
 * Main Financial Dashboard component - Manages the financial visualization and controls
 * 
 * @returns {JSX.Element} - Rendered component
 */
const FinancialDashboard = () => {
  // Use our custom data fetching hook
  const { data, loading } = useFinancialData();
  
  // State for storing user input from sliders
  const [userInputs, setUserInputs] = useState(defaultUserInputs);
  
  // State for controlling slider panel visibility
  const [showSliders, setShowSliders] = useState(true);

  // State for accordion panels
  const [accordionStates, setAccordionStates] = useState({
    income: true,
    education: false,
    living: false,
    personal: false
  });
  
  // Add DataContext to access submitted form data
  const { dataToPlot } = useContext(DataContext);
  
  // Update slider values when form data becomes available in context
  useEffect(() => {
    if (dataToPlot && dataToPlot.current_user) {
      console.log('Updating sliders with form data:', dataToPlot.current_user, dataToPlot);
      setUserInputs(prev => ({
        ...prev,
        ...dataToPlot.current_user
      }));
    }
  }, [dataToPlot]);
  
  // Handle slider changes
  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    setUserInputs(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };

  // Simplified reset function - directly uses dataToPlot
  const handleReset = () => {
    if (dataToPlot && dataToPlot.current_user) {
      setUserInputs(prev => ({
        ...prev,
        ...dataToPlot.current_user
      }));
    } else {
      // Fallback to defaultUserInputs if dataToPlot isn't available
      setUserInputs(defaultUserInputs);
    }
  };

  // set Opened state for accordion panels
  const handleAccordionToggle = (category) => {
    setAccordionStates(prev => {
      const newStates = Object.keys(prev).reduce((acc, key) => {
        acc[key] = key === category ? !prev[key] : false;
        return acc;
      }, {});
      return newStates;
    });
  };
  
  // Calculate financial metrics for the user
  const { metrics: financialMetrics, loading: metricsLoading, error: metricsError } = useCalculateFinancialMetrics(userInputs);
  
  // Determine financial category
  const financialCategory = getFinancialCategory(
    data, 
    financialMetrics.user_point_x, 
    financialMetrics.user_point_y
  );
  
  // Toggle sliders visibility
  const toggleSliders = () => {
    setShowSliders(!showSliders);
  };
  
  // Organize sliders into groups
  const sliderGroups = [
    {
      title: "Income",
      category: "income",
      collapsible: true, 
      initialCollapsed: false, 
      sliders: [
        { name: "monthly_income", label: "Monthly Income", min: 0, max: 20000, step: 100 },
        { name: "financial_aid", label: "Financial Aid", min: 0, max: 20000, step: 100 }
      ]
    },
    {
      title: "Education Expenses",
      category: "education",
      collapsible: true,
      initialCollapsed: false,
      sliders: [
        { name: "tuition", label: "Tuition", min: 0, max: 80000, step: 1000 },
        { name: "books_supplies", label: "Books & Supplies", min: 0, max: 2000, step: 50 }
      ]
    },
    {
      title: "Living Expenses",
      category: "living",
      collapsible: true,
      initialCollapsed: true,
      sliders: [
        { name: "housing", label: "Housing", min: 0, max: 20000, step: 100 },
        { name: "food", label: "Food", min: 0, max: 2000, step: 50 },
        { name: "transportation", label: "Transportation", min: 0, max: 2000, step: 50 }
      ]
    },
    {
      title: "Personal Expenses",
      category: "personal",
      collapsible: true,
      initialCollapsed: true,
      sliders: [
        { name: "entertainment", label: "Entertainment", min: 0, max: 2000, step: 50 },
        { name: "personal_care", label: "Personal Care", min: 0, max: 2000, step: 50 },
        { name: "technology", label: "Technology", min: 0, max: 20000, step: 100 },
        { name: "health_wellness", label: "Health & Wellness", min: 0, max: 2000, step: 50 },
        { name: "miscellaneous", label: "Miscellaneous", min: 0, max: 2000, step: 50 }
      ]
    }
  ];
  
  return (
    <div className="financial-dashboard">
      {/* Dashboard container with two-column layout */}
      <div className="dashboard-container">
        {/* Toggle button for sliders panel */}
        <button 
          onClick={toggleSliders}
          className="toggle-sliders-btn"
          aria-label={showSliders ? "Hide controls" : "Show controls"}
        >
          {showSliders ? "→" : "←"}
        </button>
        
        {/* Left panel - Visualization & Summary */}
        <div className={`visualization-panel ${!showSliders ? 'full-width' : ''}`}>
          <h2 className="app-font dashboard-title">Financial Spending Analysis</h2>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading your financial analysis...</p>
            </div>
          ) : (
            <div>
              {/* Chart and Legend layout */}
              <div className="chart-container">
                <FinancialVisualization 
                  data={data} 
                  userInputs={userInputs} 
                  financialCategory={financialCategory} 
                />
                <ChartLegend financialCategory={financialCategory} />
              </div>
              
              {/* Financial Insights Panel */}
              <FinancialInsightsPanel 
                financialCategory={financialCategory}
                monthlyIncome={financialMetrics.monthly_income}
                monthlySpending={financialMetrics.monthly_spending}
                budgetMargin={financialMetrics.budget_margin}
                savingsAmount={financialMetrics.savings_amount}
              />
            </div>
          )}
        </div>
        
        {/* Right panel - Sliders (conditionally rendered) */}
        {showSliders && (
          <div className="sliders-panel">
            <div className="sliders-header">
              <h2 className="app-font sliders-title">Adjust Your Financial Details</h2>
              <button 
                className="reset-btn" 
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
            
            <div className="sliders-content">
              {sliderGroups.map(group => (
                <FinancialSliderGroup
                  key={group.title}
                  title={group.title}
                  category={group.category}
                  sliders={group.sliders}
                  userInputs={userInputs}
                  handleSliderChange={handleSliderChange}
                  collapsible={group.collapsible}
                  isOpen={accordionStates[group.category]}
                  setOpen={handleAccordionToggle}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialDashboard;