import { createContext, useState } from 'react';

const DataContext = createContext();

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

