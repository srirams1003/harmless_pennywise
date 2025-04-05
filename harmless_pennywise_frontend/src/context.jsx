import { createContext, useState } from 'react';

const DataContext = createContext();

const DataProvider = ({ children }) => {
    const [dataToPlot, setDataToPlot] = useState(null);
    const [showForm, setShowForm] = useState(true);

    return (
        <DataContext.Provider value={{ showForm, setShowForm, dataToPlot, setDataToPlot }}>
            {children}
        </DataContext.Provider>
    );
};

export { DataContext, DataProvider };

