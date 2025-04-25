import { useState, useContext, useEffect } from 'react';
import './App.css';
import { DataContext } from './context';

// the input form component to collect user data and process it for insights
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

	const [activeSection, setActiveSection] = useState('personal');
	const [formProgress, setFormProgress] = useState(0);

	// Calculate form completion percentage
	useEffect(() => {
		const totalFields = Object.keys(formData).length;
		const filledFields = Object.values(formData).filter(value => value !== '').length;
		setFormProgress((filledFields / totalFields) * 100);
	}, [formData]);

	const handleChange = (e) => {
		// Comment out the prefill during production
		let { name, value } = e.target;
		if (!isNaN(value)) {
			value = parseFloat(value);
		}
		setFormData((prev) => ({ ...prev, [name]: value }));

		// // For development only - prefill form data
		// setFormData({
		//   "age": 22,
		//   "gender": "Male",
		//   "year_in_school": "Senior",
		//   "major": "Computer Science",
		//   "monthly_income": 1100,
		//   "financial_aid": 600,
		//   "tuition": 13000,
		//   "housing": 700,
		//   "food": 300,
		//   "transportation": 160,
		//   "books_supplies": 120,
		//   "entertainment": 250,
		//   "personal_care": 130,
		//   "technology": 100,
		//   "health_wellness": 200,
		//   "miscellaneous": 70,
		//   "preferred_payment_method": "Credit/Debit Card"
		// });
	};

	// this function validates the input form and sends user data to the backend for processing and help with creating the visuals
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

			// Replace alert with a more elegant notification
			const notification = document.createElement('div');
			notification.className = 'form-notification success';
			notification.innerHTML = '<span>✓</span> Form submitted successfully!';
			document.body.appendChild(notification);
			setTimeout(() => {
				notification.classList.add('show');
				setTimeout(() => {
					notification.classList.remove('show');
					setTimeout(() => {
						document.body.removeChild(notification);
					}, 300);
				}, 2000);
			}, 100);

			console.log("received response from backend for form submission: ", result);

			setSubmittedFormData(formData); // Save for future unhide
			setShowForm(false); // hide form after form has been submitted
		} catch (error) {
			console.error('Error submitting form:', error);

			// Replace alert with a more elegant error notification
			const notification = document.createElement('div');
			notification.className = 'form-notification error';
			notification.innerHTML = '<span>✗</span> Submission failed. Please try again.';
			document.body.appendChild(notification);
			setTimeout(() => {
				notification.classList.add('show');
				setTimeout(() => {
					notification.classList.remove('show');
					setTimeout(() => {
						document.body.removeChild(notification);
					}, 300);
				}, 2000);
			}, 100);
		}
	};

	// this object helps set the labels for the fields in the input form more cleanly
	const fieldLabels = {
		age: "Age (in years)",
		gender: "Gender",
		year_in_school: "Year in School",
		major: "Major",
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
		preferred_payment_method: "Preferred Payment Method"
	};

	// Group fields into sections
	const formSections = {
		personal: ['age', 'gender', 'year_in_school', 'major'],
		income: ['monthly_income', 'financial_aid'],
		education: ['tuition', 'books_supplies'],
		living: ['housing', 'food', 'transportation'],
		lifestyle: ['entertainment', 'personal_care', 'technology', 'health_wellness', 'miscellaneous'],
		payment: ['preferred_payment_method']
	};

	const sectionTitles = {
		personal: 'Personal Information',
		income: 'Income Sources',
		education: 'Education Expenses',
		living: 'Living Expenses',
		lifestyle: 'Lifestyle Expenses',
		payment: 'Payment Preferences'
	};

	const sectionColors = {
		personal: '#4f46e5', // Purple from button
		income: '#4CAF50', // Green from sliders
		education: '#2196F3', // Blue from education section
		living: '#FF9800', // Orange from living group
		lifestyle: '#9C27B0', // Purple for lifestyle
		payment: '#ec4899' // Pink from button gradient
	};

	return (
		<div className="form-container">

			<div className="form-header">
				<h2>Tell us about your finances</h2>
				<div className="form-progress-container">
					<div className="form-progress-bar" style={{ width: `${formProgress}%` }}>
						<div className="form-progress-glow"></div>
					</div>
					<span className="form-progress-text">{Math.round(formProgress)}% Complete</span>
				</div>
			</div>

			<div className="form-tabs">
				{Object.keys(formSections).map(section => (
					<button
						key={section}
						className={`form-tab ${activeSection === section ? 'active' : ''}`}
						onClick={() => setActiveSection(section)}
						style={{ 
							'--tab-color': sectionColors[section],
							'--tab-glow-opacity': activeSection === section ? '0.5' : '0' 
						}}
					>
						<span>{sectionTitles[section]}</span>
					</button>
				))}
			</div>

			<form id="input-form" onSubmit={handleSubmit}>
				{Object.keys(formSections).map(section => (
					<div 
						key={section}
						className={`form-section ${activeSection === section ? 'active' : ''}`}
						style={{ 
							'--section-color': sectionColors[section] 
						}}
					>
						<div className="section-title">
							<h3>{sectionTitles[section]}</h3>
							<div className="section-indicator" style={{ backgroundColor: sectionColors[section] }}></div>
						</div>

						<div className="section-fields">
							{formSections[section].map(key => (
								<div className="form-field" key={key}>
									<label className="form-field-label" htmlFor={key}>
										{fieldLabels[key] || key.replace(/_/g, ' ')}
									</label>

									{key === 'gender' || key === 'year_in_school' || key === 'preferred_payment_method' ? (
										<div className="select-wrapper">
											<select 
												id={key}
												name={key} 
												value={formData[key]} 
												onChange={handleChange} 
												required
												className="form-select"
											>
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
											<div className="select-arrow"></div>
										</div>
									) : (
											<input
												id={key}
												type={typeof formData[key] === 'number' ? 'number' : 'text'}
												name={key}
												value={formData[key]}
												onChange={handleChange}
												required
												className="form-input"
												placeholder={key.includes('income') || key.includes('aid') || key.includes('tuition') ? 'Enter amount in USD' : ''}
											/>
										)}
								</div>
							))}
						</div>
					</div>
				))}

				<div className="form-navigation">
					{activeSection !== 'personal' && (
						<button 
							type="button" 
							className="nav-button prev-button"
							onClick={() => {
								const sections = Object.keys(formSections);
								const currentIndex = sections.indexOf(activeSection);
								if (currentIndex > 0) {
									setActiveSection(sections[currentIndex - 1]);
								}
							}}
						>
							<span className="nav-icon">←</span> Previous
						</button>
					)}

					{activeSection !== 'payment' ? (
						<button 
							type="button" 
							className="nav-button next-button"
							onClick={() => {
								const sections = Object.keys(formSections);
								const currentIndex = sections.indexOf(activeSection);
								if (currentIndex < sections.length - 1) {
									setActiveSection(sections[currentIndex + 1]);
								}
							}}
						>
							Next <span className="nav-icon">→</span>
						</button>
					) : (
							<button type="submit" className="nav-button submit-button">
								<span className="button-glow"></span>
								<span className="button-text">Analyze My Finances</span>
							</button>
						)}
				</div>
			</form>
		</div>
	);
};

export default InputForm;
