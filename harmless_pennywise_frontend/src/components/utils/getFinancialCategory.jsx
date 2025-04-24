/**
 * Determines a financial category based on coordinates and boundary lines
 * 
 * @param {Object} data - The data object containing boundary coordinates
 * @param {number} px - The x coordinate of the point
 * @param {number} py - The y coordinate of the point
 * @returns {string} - The financial category: 'saver', 'balanced', or 'overspender'
 */
export const getFinancialCategory = (data, px, py) => {
    if (!data.boundary_coordinates) {
      console.log("No boundary coordinates available");
      return 'balanced';
    }
    
    const pointSide = (p1, p2, px, py) => {
      return (p2[0] - p1[0]) * (py - p1[1]) - (p2[1] - p1[1]) * (px - p1[0]);
    };
  
    let isBelowSaver = false;
    let isBelowOverspender = false;
    
    // Check against saver_balanced line
    if (data.boundary_coordinates.saver_balanced?.length >= 2) {
      const [p1, p2] = data.boundary_coordinates.saver_balanced;
      const side = pointSide(p1, p2, px, py);
      isBelowSaver = side < 0; 
    }
    
    // Check against balanced_overspender line
    if (data.boundary_coordinates.balanced_overspender?.length >= 2) {
      const [p1, p2] = data.boundary_coordinates.balanced_overspender;
      const side = pointSide(p1, p2, px, py);
      isBelowOverspender = side > 0;
    }
    
    // Decide category
    if (isBelowSaver) return 'saver';
    else if (!isBelowOverspender) return 'overspender';
    else return 'balanced';
  };
  
  export default getFinancialCategory;