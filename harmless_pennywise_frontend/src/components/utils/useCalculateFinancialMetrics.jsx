import { useState, useEffect } from 'react';

/**
 * Custom hook for calculating financial metrics from user inputs
 * @param {Object} userInputs - The user's financial inputs
 * @returns {Object} - Object containing metrics, loading state, and error state
 */
export const useCalculateFinancialMetrics = (userInputs) => {
  const [metrics, setMetrics] = useState({
    // Default fallback values in case the API fails
    monthly_income: 0,
    monthly_spending: 0,
    budget_margin: 0,
    savings_amount: 0,
    savings_rate: 0,
    user_point_x: 0,
    user_point_y: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use local calculation as fallback
  const calculateLocalMetrics = () => {
    // Adjust tuition, financial_aid, and books_supplies by dividing by 4 (semester to monthly)
    const adjustedUserInputs = {...userInputs};
    adjustedUserInputs.tuition = adjustedUserInputs.tuition / 4;
    adjustedUserInputs.financial_aid = adjustedUserInputs.financial_aid / 4;
    adjustedUserInputs.books_supplies = adjustedUserInputs.books_supplies / 4;
    
    const monthlyIncome = userInputs.monthly_income + adjustedUserInputs.financial_aid;
    const monthlySpending = Object.entries(adjustedUserInputs).reduce((sum, [key, value]) => {
      if (key === 'monthly_income' || key === 'financial_aid') {
        return sum;
      }
      // Keep values as monthly
      return sum + value;
    }, 0);
    
    // Changed from ratio to margin (spending minus income)
    const budgetMargin = monthlySpending - monthlyIncome;
    const savingsAmount = monthlyIncome - monthlySpending;
    const savingsRate = (savingsAmount / monthlyIncome) * 100;

    return {
      monthly_income: monthlyIncome,
      monthly_spending: monthlySpending,
      budget_margin: budgetMargin,
      savings_amount: savingsAmount,
      savings_rate: savingsRate,
      user_point_x: budgetMargin,
      user_point_y: monthlySpending
    };
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://localhost:8000/calculate_financial_metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userInputs)
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
          console.log('Received financial metrics from backend:', data);
        } else {
          console.warn(`API response not OK: ${response.status}. Using local calculation.`);
          // Use local calculation as fallback
          const localMetrics = calculateLocalMetrics();
          setMetrics(localMetrics);
        }
      } catch (err) {
        if (!isMounted) return;
        
        console.error('Error fetching financial metrics:', err);
        setError(err.message);
        
        // Use local calculation as fallback
        console.log('Using local calculation as fallback');
        const localMetrics = calculateLocalMetrics();
        setMetrics(localMetrics);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMetrics();

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(userInputs)]); // Stringify to prevent infinite re-renders

  return { metrics, loading, error };
};

export default useCalculateFinancialMetrics;