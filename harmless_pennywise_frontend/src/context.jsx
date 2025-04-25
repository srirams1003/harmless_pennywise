import { createContext, useState } from 'react';

const DataContext = createContext();

// creating the DataProvider object here to leverage the React context API and share data between components by wrapping the main app component
const DataProvider = ({ children }) => {
    const [dataToPlot, setDataToPlot] = useState(null);
    const [showForm, setShowForm] = useState(true);
	const [submittedFormData, setSubmittedFormData] = useState(null);

    return (
        <DataContext.Provider value={{submittedFormData, setSubmittedFormData, showForm, setShowForm, dataToPlot, setDataToPlot }}>
            {children}
        </DataContext.Provider>
    );
};

export { DataContext, DataProvider };

