import { createContext, useState } from 'react';

const DataContext = createContext();

const DataProvider = ({ children }) => {
    const [dataToPlot, setDataToPlot] = useState(null);

    return (
        <DataContext.Provider value={{ dataToPlot, setDataToPlot }}>
            {children}
        </DataContext.Provider>
    );
};

export { DataContext, DataProvider };

