import { useState, useContext } from 'react'
import './App.css'
import { DataContext, DataProvider } from './context';
import FirstView from  './FirstView';
import InputForm from  './InputForm';
import SecondView from  './SecondView';

// separating this into a different component for ease of use with the React Context API
function AppContent() {
	const { showForm, setShowForm } = useContext(DataContext);

	return (
		<>
			<h1 className="app-font">Harmless PennyWise</h1>
			<div id="container-for-views" style={{ display: 'flex', flexDirection: 'column' }}>
				<div className="premium-button-wrapper">
					<div className="premium-button-container">
						<div className="button-ripple"></div>
						<button 
						onClick={()=>{setShowForm(!showForm)}}
						className="premium-button"
						>
						<div className="button-glow"></div>
						<span className="button-text">
							<span className="app-font">{showForm ? 'Hide Form' : 'Analyze My Finances'}</span>
							<span className="button-icon">{showForm ? '↑' : '↓'}</span>
						</span>
						</button>
						
					</div>
					
					{!showForm && (
						<p className="button-subtext">
						Get personalized financial insights in seconds. See how your spending compares to others.
						</p>
					)}
				</div>

				{showForm && <InputForm />}

				<div id="two-view-components-container" style={{display: 'flex', flexDirection: 'column'}}>
					<FirstView />
					<SecondView />
				</div>
			</div>
		</>
	);
}

function App() {
	// wrapping our main app with the React context API to share data between different components
	return (
		<DataProvider>
			<AppContent />
		</DataProvider>
	)
}

export default App
