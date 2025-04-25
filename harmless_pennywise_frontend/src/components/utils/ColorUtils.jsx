/**
 * Utility functions for getting category colors
 */

/**
 * Returns a color based on category
 * @param {string} category - Category name
 * @returns {string} - Hex color code
 */
export const getCategoryColor = (category) => {
    const categoryColors = {
      // Original categories with new colors
      income: '#4AC29A',      // Soft teal
      education: '#5D87FF',   // Calm blue
      living: '#FF965D',      // Muted orange
      personal: '#B76EFF',    // Soft purple
      
      // Financial status categories
      saver: '#4AC29A',       // Soft teal
      balanced: '#5D87FF',    // Calm blue
      overspender: '#FF5D5D', // Soft red
      
      // Positive and negative indicators
      positive: '#4AC29A',    // Soft teal
      negative: '#FF5D5D',    // Soft red
      
      default: '#5D87FF'      // Default blue
    };
    
    return categoryColors[category] || categoryColors.default;
  };
  
  export default {
    getCategoryColor
  };