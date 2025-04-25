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


  // Add state for validation errors
  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);
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

    // Prevent setting negative numbers
    if (e.target.type === 'number' && parseFloat(value) < 0) {
      return;
    }

    if (value !== '' && !isNaN(value)) {
      value = parseFloat(value);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: null }));
    }

    // For development only - prefill form data
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

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Validate all required fields
    for (const key in formData) {
      // Check if field is empty or contains only whitespace
      if (formData[key] === '' || formData[key] === null || formData[key] === undefined) {
        newErrors[key] = `required`;
        isValid = false;
      }
    }

    // Additional validation rules can be added here
    // For example, ensuring numerical values are positive
    const numericFields = [
      'monthly_income', 'financial_aid', 'tuition', 'housing', 'food', 
      'transportation', 'books_supplies', 'entertainment', 'personal_care', 
      'technology', 'health_wellness', 'miscellaneous'
    ];

    numericFields.forEach(field => {
      if (formData[field] !== '' && formData[field] !== null && formData[field] !== undefined && parseFloat(formData[field]) < 0) {
        newErrors[field] = `${fieldLabels[field]} cannot be negative`;
        isValid = false;
      }
    });

    // Age validation
    if (formData.age !== '' && formData.age !== null && formData.age !== undefined && (parseInt(formData.age) < 15 || parseInt(formData.age) > 100)) {
      newErrors.age = 'Age must be between 15 and 100';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Find first section with errors (for navigation)
  const findSectionWithErrors = () => {
    for (const section in formSections) {
      for (const field of formSections[section]) {
        if (errors[field]) {
          return section;
        }
      }
    }
    return activeSection; // Fallback to current section
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const isValid = validateForm();
    
    // If validation fails, show errors and navigate to first section with errors
    if (!isValid) {
      setShowErrors(true);
      const errorSection = findSectionWithErrors();
      setActiveSection(errorSection);
      
      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'form-notification error';
      notification.innerHTML = '<span>✗</span> Please complete all required fields.';
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
      
      return;
    }
    
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
      
      // Show success notification
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

      // Reset validation state
      setErrors({});
      setShowErrors(false);
      
      setSubmittedFormData(formData); // Save for future unhide
      setShowForm(false); // hide form after form has been submitted
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Show error notification
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
        {Object.keys(formSections).map(section => {
          // Check if this section has errors
          const hasErrors = formSections[section].some(field => errors[field]);
          
          return (
            <button
              key={section}
              className={`form-tab ${activeSection === section ? 'active' : ''} ${hasErrors && showErrors ? 'has-error' : ''}`}
              onClick={() => setActiveSection(section)}
              style={{ 
                '--tab-color': hasErrors && showErrors ? '#e74c3c' : sectionColors[section],
                '--tab-glow-opacity': activeSection === section ? '0.5' : '0' 
              }}
            >
              <span>{sectionTitles[section]}</span>
              {hasErrors && showErrors && <span className="error-indicator">!</span>}
            </button>
          );
        })}
      </div>
      
      <form id="input-form" onSubmit={handleSubmit} noValidate>
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
                <div className={`form-field ${errors[key] && showErrors ? 'has-error' : ''}`} key={key}>
                  <label className="form-field-label" htmlFor={key}>
                    {fieldLabels[key] || key.replace(/_/g, ' ')}
                    <span className="required-indicator">*</span>
                  </label>
                  
                  {key === 'gender' || key === 'year_in_school' || key === 'preferred_payment_method' ? (
                    <div className="select-wrapper">
                      <select 
                        id={key}
                        name={key} 
                        value={formData[key]} 
                        onChange={handleChange} 
                        className={`form-select ${errors[key] && showErrors ? 'error-border' : ''}`}
                        aria-invalid={errors[key] && showErrors ? "true" : "false"}
                        aria-describedby={errors[key] && showErrors ? `${key}-error` : null}
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
                      value={formData[key] || ''}
                      onChange={handleChange}
                      className={`form-input ${errors[key] && showErrors ? 'error-border' : ''}`}
                      placeholder={key.includes('income') || key.includes('aid') || key.includes('tuition') ? 'Enter amount in USD' : ''}
                      aria-invalid={errors[key] && showErrors ? "true" : "false"}
                      aria-describedby={errors[key] && showErrors ? `${key}-error` : null}
                    />
                  )}
                  
                  {/* Error message display */}
                  {errors[key] && showErrors && (
                    <div id={`${key}-error`} className="error-message">{errors[key]}</div>
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