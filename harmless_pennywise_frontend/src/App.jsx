import { useState, useContext } from 'react'
import './App.css'
import { DataProvider } from './context';
import FirstView from  './FirstView';
import InputForm from  './InputForm';
import SecondView from  './SecondView';


// TODO: need to figure out the final layout of our platform. Right now, every thing is just one followed by the other below it. Need to put things next  to each other, especially the sliders for view1 and view1's scatterplot should be side by side, according to our design
function App() {
	const [showForm, setShowForm] = useState(true);

	return (
		<DataProvider>
			<div id='mainbody'>
				<h1>Harmless PennyWise</h1>
				<div id="container-for-views" style={{display: 'flex', flexDirection: 'column'}}>
					<button onClick={()=>{setShowForm(!showForm)}}>
						{showForm ? 'Hide Input Form' : 'Show Input Form'}
					</button>

					{showForm && <InputForm />}

					<div style={{display: 'flex', flexDirection: 'row'}}> {/* TODO: need to change flexdirection later to row*/}
						<SecondView />
						<FirstView />
					</div>
				</div>
			</div>
		</DataProvider>
	)
}

export default App
