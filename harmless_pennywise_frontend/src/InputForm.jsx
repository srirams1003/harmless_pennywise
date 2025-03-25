import { useState } from 'react'
import './App.css'

const InputForm = () => {
	return (
		<div style={{ border: '2px solid blue', padding: '10px', margin: '10px' }}>
			<h2>Input Form Component</h2>
			<form>
				<input type="text" placeholder="Enter something..." />
				<p>This is a placeholder for the form to get user input.</p>
				<button type="submit">Submit</button>
			</form>
		</div>
	);
};

export default InputForm;
