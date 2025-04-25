import React, { useContext } from 'react';
import { DataContext } from './context';
import FinancialDashboard from './components/FinancialDashboard';

/**
 * First View Component - Main entry point for the financial analysis dashboard
 * 
 * @returns {JSX.Element} - Rendered component
 */
const FirstView = () => {
  // Check if input form has been filled yet
  const { dataToPlot } = useContext(DataContext);

  // Make a copy of the data to avoid mutation issues
  let dataToPlotCopy = {...dataToPlot};

  // Only render if we have data
  if (!dataToPlotCopy) return <div>No data available</div>;
  if (!dataToPlotCopy.all_users_average || !dataToPlotCopy.current_user) return <div></div>;

  return (
    <div id="first-view-container">
      <FinancialDashboard />
    </div>
  );
};

export default FirstView;