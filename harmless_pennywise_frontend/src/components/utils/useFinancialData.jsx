import { useState, useEffect } from 'react';

// Mock data for fallback
const mockData = {
  boundary_coordinates: {
    saver_balanced: [[0.1, 0.2], [0.3, 0.5], [0.5, 0.3], [0.1, 0.2]],
    balanced_overspender: [[0.5, 0.3], [0.7, 0.6], [0.9, 0.4], [0.5, 0.3]]
  },
  dataset_points: Array(100).fill().map(() => [
    Math.random() > 0.5 ? 'saver' : Math.random() > 0.5 ? 'balanced' : 'overspender',
    Math.random() * 0.9,
    Math.random() * 0.8
  ]),
  original_points: Array(20).fill().map(() => ({
    income: Math.random() * 100000,
    spending: Math.random() * 80000,
    savings: Math.random() * 20000,
    debt: Math.random() * 15000
  }))
};

/**
 * Custom hook for fetching financial data from the API
 * @returns {Object} - Object containing data, loading state, and fetchData function
 */
export const useFinancialData = () => {
  const [data, setData] = useState(mockData);
  const [loading, setLoading] = useState(false);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching initial data from backend...');
      // Call to backend API
      const response = await fetch('http://localhost:8000/initial_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Received data from backend:', responseData);
        
        // Ensure the response data has the expected structure
        if (responseData.boundary_coordinates && 
            responseData.dataset_points && 
            responseData.original_points) {
          setData(responseData);
        } else {
          console.warn('Response data missing expected fields, using mock data');
          setData(mockData);
        }
      } else {
        console.error('API response not OK:', response.status);
        setData(mockData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to mock data on error
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  return { data, loading, fetchData };
};

export default useFinancialData;