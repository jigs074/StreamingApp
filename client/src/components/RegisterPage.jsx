import { useEffect, useState } from "react";
import './RegisterPage.css'; // Import your existing CSS

const Register = () => {
  const [userType, setUserType] = useState('candidate');

  useEffect(() => {
    // Ensure body styles are applied for centering
    document.body.style.display = 'flex';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
    document.body.style.minHeight = '100vh';
    document.body.style.margin = '0';
    document.body.style.fontFamily = "'Inter', sans-serif";
    document.body.style.background = 'linear-gradient(120deg, #0d0d0d, #1a1a1a)';
    document.body.style.color = '#fff';

    const populateCompaniesDropdown = async () => {
      try {
        const response = await fetch('/companies');
        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }
        const data = await response.json();
        const dropdown = document.getElementById('company');

        data.companies.forEach((company) => {
          const option = document.createElement('option');
          option.value = company.name;
          option.textContent = company.name;
          dropdown.appendChild(option);
        });

        // Only initialize select2 if it's available
        if (window.$ && window.$.fn.select2) {
          window.$('#company').select2({
            placeholder: 'Select your company',
            allowClear: true
          });
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
      }
    };

    populateCompaniesDropdown();

    // Cleanup function
    return () => {
      document.body.style.display = '';
      document.body.style.justifyContent = '';
      document.body.style.alignItems = '';
      document.body.style.minHeight = '';
      document.body.style.margin = '';
      document.body.style.fontFamily = '';
      document.body.style.background = '';
      document.body.style.color = '';
    };
  }, []);

  const handleUserTypeChange = (type) => {
    setUserType(type);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(e.target);
    const endpoint = userType === 'interviewer' ? '/register/interviewer' : '/register/candidate';
    
    // Submit to appropriate endpoint
    fetch(endpoint, {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (response.ok) {
        // Handle successful registration
        console.log('Registration successful');
        // You can redirect or show success message here
      } else {
        // Handle error
        console.error('Registration failed');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  };

  return (
    <div className="main">
      <h1>Xynq - Sign up</h1>
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2 className="form-title">What type of user are you?</h2>
        <div className="form-radio">
          <input 
            type="radio" 
            name="tag" 
            value="candidate" 
            id="candidate" 
            checked={userType === 'candidate'}
            onChange={() => handleUserTypeChange('candidate')}
          />
          <label htmlFor="candidate">Candidate</label>

          <input 
            type="radio" 
            name="tag" 
            value="interviewer" 
            id="interviewer" 
            checked={userType === 'interviewer'}
            onChange={() => handleUserTypeChange('interviewer')}
          />
          <label htmlFor="interviewer">Interviewer</label>
        </div>

        <div className="form-name-group">
          <div className="form-textbox">
            <label htmlFor="firstName">First Name</label>
            <input type="text" id="first-name" name="firstName" placeholder="Enter your first name" required />
          </div>

          <div className="form-textbox">
            <label htmlFor="lastName">Last Name</label>
            <input type="text" id="lastName" name="lastName" placeholder="Enter your last name" required />
          </div>
        </div>

        <div className="form-textbox">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" placeholder="Enter your email" required />
        </div>

        <div className="form-textbox">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" placeholder="Enter your password" required />
        </div>

        <div className="form-textbox">
          <label htmlFor="confirm-password">Confirm Password</label>
          <input type="password" id="confirm-password" name="confirm-password" placeholder="Confirm your password" required />
        </div>

        <div className={`dynamic-fields ${userType === 'interviewer' ? 'visible' : ''}`} id="interviewer-fields">
          <div className="form-textbox">
            <label htmlFor="company">Company</label>
            <select id="company" name="company" style={{ color: "black" }}>
              <option value="" disabled selected>Select your company</option>
            </select>
          </div>
          <div className="form-textbox">
            <a href="/register-company" className="term-service">Register your company if not registered</a>
          </div>
        </div>

        <div className="form-textbox">
          <button type="submit" className="submit">Create account</button>
        </div>
      </form>

      <p className="loginhere">
        Already have an account? <a href="/login" className="loginhere-link">Log in</a>
      </p>
    </div>
  );
};

export default Register;