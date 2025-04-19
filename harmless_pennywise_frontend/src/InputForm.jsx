import { useState, useContext, useEffect } from 'react';
import './App.css';
import { DataContext } from './context';

const InputForm = () => {
	let { showForm, setShowForm, dataToPlot, setDataToPlot, submittedFormData, setSubmittedFormData } = useContext(DataContext);

	const [formData, setFormData] = useState(submittedFormData || {
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

	// TODO: do we want to persist the data the user inputted into the form across reloads using localStorage?


	const handleChange = (e) => {
		// TODO: uncomment these lines when actually deploying/testing with users
		let { name, value } = e.target;
		if (!isNaN(value)){
			value = parseFloat(value);
		};
		setFormData((prev) => ({ ...prev, [name]: value }));

		// // currently just pre fill form during development for convenience
		// setFormData(	{
		// 	"age": 22,
		// 	"gender": "Male",
		// 	"year_in_school": "Senior",
		// 	"major": "Computer Science",
		// 	"monthly_income": 1100,
		// 	"financial_aid": 600,
		// 	"tuition": 13000,
		// 	"housing": 700,
		// 	"food": 300,
		// 	"transportation": 160,
		// 	"books_supplies": 120,
		// 	"entertainment": 250,
		// 	"personal_care": 130,
		// 	"technology": 100,
		// 	"health_wellness": 200,
		// 	"miscellaneous": 70,
		// 	"preferred_payment_method": "Credit/Debit Card"
		// });
	};

	// TODO: next to each field, add if it is required and also what the units are and what the time period is for collecting/reporting that data
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			console.log('Sending Data:', formData);

			const response = await fetch('http://localhost:8000/predict_category', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				throw new Error('Failed to submit form');
			}

			const result = await response.json();
			let data_to_plot = {};
			data_to_plot["all_users_average"] = result["all_users_average"];

			const userDataCopy = { ...formData };
			// Delete unwanted fields
			delete userDataCopy.age;
			delete userDataCopy.gender;
			delete userDataCopy.year_in_school;
			delete userDataCopy.major;
			delete userDataCopy.preferred_payment_method;

			data_to_plot["current_user"] = userDataCopy;

			setDataToPlot(data_to_plot);

			console.log("received response from backend for averages: ", result["all_users_average"]);
			alert('Form submitted successfully!');
			console.log("received response from backend for form submission: ", result);

			setSubmittedFormData(formData); // Save for future unhide
			setShowForm(false); // hide form after form has been submitted
		} catch (error) {
			console.error('Error submitting form:', error);
			alert('Submission failed. Please try again.');
		}
	};

	// TODO: for all these fields that are being collected from the user but not actually being in the computation, think about what we can do with them
	const fieldLabels = {
		age: "Age (in years)", // not used in computations
		gender: "Gender",// not used in computations
		year_in_school: "Year in School",// not used in computations
		major: "Major",// not used in computations
		monthly_income: "Monthly Income (in USD per month)",
		financial_aid: "Financial Aid (in USD per semester)",
		tuition: "Tuition (in USD per semester)",
		housing: "Housing (in USD per month)",
		food: "Food (in USD per month)",
		transportation: "Transportation (in USD per month)",
		books_supplies: "Books & Supplies (in USD per semester)",
		entertainment: "Entertainment (in USD per month)",
		personal_care: "Personal Care (in USD per month)",
		technology: "Technology (in USD per month)",
		health_wellness: "Health & Wellness (in USD per month)",
		miscellaneous: "Miscellaneous (in USD per month)",
		preferred_payment_method: "Preferred Payment Method"// not used in computations
	};

	return (
		<div id='input-form-container'>
			<h2> User Data Form </h2>
			<form id='input-form' onSubmit={handleSubmit}>
				{Object.entries(formData).map(([key, value]) => (
					<div className="form-item" key={key}>
						<label className="form-item-label">{fieldLabels[key] || key.replace(/_/g, ' ')}:</label>
						{key === 'gender' || key === 'year_in_school' || key === 'preferred_payment_method' ? (
							<select name={key} value={value} onChange={handleChange} required>
								{key === 'gender' && <>
									<option value="">Select Gender</option>
									<option value="Male">Male</option>
									<option value="Female">Female</option>
									<option value="Other">Other</option>
								</>}
								{key === 'year_in_school' && <>
									<option value="">Select Year</option>
									<option value="Freshman">Freshman</option>
									<option value="Sophomore">Sophomore</option>
									<option value="Junior">Junior</option>
									<option value="Senior">Senior</option>
									<option value="Graduate">Graduate</option>
								</>}
								{key === 'preferred_payment_method' && <>
									<option value="">Select Payment Method</option>
									<option value="Credit/Debit Card">Credit/Debit Card</option>
									<option value="Cash">Cash</option>
									<option value="Mobile Payment">Mobile Payment</option>
									<option value="Bank Transfer">Bank Transfer</option>
								</>}
							</select>
						) : (
								<input
									type={typeof value === 'number' ? 'number' : 'text'}
									name={key}
									value={value}
									onChange={handleChange}
									required
								/>
							)}
					</div>
				))}
				<button type="submit">Submit</button>
			</form>
		</div>
	);
};

export default InputForm;
