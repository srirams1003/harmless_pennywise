import { useState } from 'react';
import './App.css';

const InputForm = () => {
	const [formData, setFormData] = useState({
		age: '',
		gender: '',
		year_in_school: '',
		major: '',
		monthly_income: '',
		financial_aid: '',
		tuition: '',
		housing: '',
		food: '',
		transportation: '',
		books_supplies: '',
		entertainment: '',
		personal_care: '',
		technology: '',
		health_wellness: '',
		miscellaneous: '',
		preferred_payment_method: ''
	});

	const handleChange = (e) => {
		const { name, value } = e.target;
		// setFormData({
		// 	...formData,
		// 	[name]: value
		// });
		setFormData(	{
			"age": 22,
			"gender": "Male",
			"year_in_school": "Senior",
			"major": "Computer Science",
			"monthly_income": 1200,
			"financial_aid": 500,
			"tuition": 50000,
			"housing": 8000,
			"food": 350,
			"transportation": 100,
			"books_supplies": 200,
			"entertainment": 150,
			"personal_care": 800,
			"technology": 2000,
			"health_wellness": 1200,
			"miscellaneous": 900,
			"preferred_payment_method": "Credit/Debit Card"
		});
	};

	// TODO: next to each field, add if it is required and also what the units are and what the time period is for collecting/reporting that data
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const response = await fetch('http://localhost:8000/predict_category', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				throw new Error('Failed to submit form');
			}

			const result = await response.json();
			alert('Form submitted successfully!');
			console.log(result);
		} catch (error) {
			console.error('Error submitting form:', error);
			alert('Submission failed. Please try again.');
		}
	};

	return (
		<div style={{ border: '2px solid blue', padding: '10px', margin: '10px' }}>
			<h2>Input Form Component</h2>
			<form onSubmit={handleSubmit}>
				{Object.keys(formData).map((key) => (
					<div key={key}>
						<label>{key.replace(/_/g, ' ')}:</label>
						<input
							type={typeof formData[key] === 'number' ? 'number' : 'text'}
							name={key}
							value={formData[key]}
							onChange={handleChange}
							// required
						/>
					</div>
				))}
				<button type="submit">Submit</button>
			</form>
		</div>
	);
};

export default InputForm;
