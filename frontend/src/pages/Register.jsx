// src/pages/Register.jsx
import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Register.css';

const Register = () => {
  const [registerType, setRegisterType] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    // Other fields will be added based on register type
    full_name: '',
    phone: '',
    location: '',
    about: '',
    company_name: '',
    industry: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useTheme();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate password match
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (!validatePassword(formData.password)) {
      setError('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data with appropriate user_type
      const userData = {
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
        user_type: registerType,
      };

      // Add type-specific fields
      if (registerType === 'jobseeker') {
        userData.full_name = formData.full_name;
        userData.phone = formData.phone || '';
        userData.location = formData.location || '';
        userData.about = formData.about || '';
      } else {
        userData.company_name = formData.company_name;
        userData.industry = formData.industry || '';
        userData.phone = formData.phone || '';
      }
      
      console.log('Sending registration data:', userData);
      const user = await register(userData);
      
      // Redirect based on user type
      if (registerType === 'company') {
        navigate('/add-job');
      } else {
        navigate('/jobs');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.email?.[0] ||
        err.response?.data?.password?.[0] ||
        err.response?.data?.detail ||
        'Registration failed. Please check your information and try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // If no registration type is selected, show the initial choice screen
  if (!registerType) {
    return (
      <div className="register-container">
        <h1 className="register-title">Register</h1>
        <p className="register-subtitle">
          How would you like to register?
        </p>
        <div className="register-type-buttons">
          <button
            className="jobseeker-button"
            onClick={() => setRegisterType('jobseeker')}
          >
            Job Seeker
          </button>
          <button
            className="company-button"
            onClick={() => setRegisterType('company')}
          >
            Company
          </button>
        </div>
      </div>
    );
  }

  // Render form based on type selected
  return (
    <div className="register-page">
      <button className="theme-toggle" onClick={toggleTheme} style={{ position: 'absolute', top: 20, right: 20 }}>
        {isDarkMode ? '🌙' : '☀️'}
      </button>
      <div className="register-container">
        <h1 className="register-title">
          {registerType === 'jobseeker'
            ? 'Register as Job Seeker'
            : 'Register as Company'}
        </h1>
        <div className="register-form-container">
          <h2 className="form-title">Register</h2>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleSubmit}>
            {/* Common fields */}
            <div className="form-group">
              <label className="form-label">
                Email:
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Email"
                className="form-input"
              />
            </div>
            
            {/* User type specific fields */}
            {registerType === 'jobseeker' ? (
              // Job seeker fields
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Full Name:
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name || ''}
                      onChange={handleChange}
                      required
                      placeholder="Full name"
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Phone (optional):
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    placeholder="Phone number"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Location (optional):
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    placeholder="e.g. Athens, Greece"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    About (optional):
                  </label>
                  <textarea
                    name="about"
                    value={formData.about || ''}
                    onChange={handleChange}
                    placeholder="Tell us about yourself"
                    className="form-input"
                    rows={3}
                  />
                </div>
              </>
            ) : (
              // Company fields
              <>
                <div className="form-group">
                  <label className="form-label">
                    Company Name:
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name || ''}
                    onChange={handleChange}
                    required
                    placeholder="Company Name"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Industry:
                  </label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry || ''}
                    onChange={handleChange}
                    placeholder="Industry"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Phone (optional):
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    placeholder="Phone number"
                    className="form-input"
                  />
                </div>
              </>
            )}
            
            {/* Password fields */}
            <div className="form-group">
              <label className="form-label">
                Password:
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter a strong password"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Confirm Password:
              </label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`register-button ${isLoading ? 'disabled' : ''}`}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="login-link-text">
            Already have an account?{' '}
            <Link to="/login" className="login-link">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;