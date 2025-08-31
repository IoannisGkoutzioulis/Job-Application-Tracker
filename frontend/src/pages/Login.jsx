// src/pages/Login.jsx
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const user = await login(email, password);
      
      // Redirect to dashboard after successful login instead of role-specific pages
      navigate('/dashboard')
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Login failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <button className="theme-toggle" onClick={toggleTheme} style={{ position: 'absolute', top: 20, right: 20 }}>
        {isDarkMode ? '🌙' : '☀️'}
      </button>
      <div className="login-container">
        <h1 className="login-title">Welcome Back</h1>
        <div className="login-form-container">
          <h2 className="form-title">Login</h2>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email:</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password:</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="form-input"
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="register-link-text">
            Don't have an account?{' '}
            <a href="/register" className="register-link">Register</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;