import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './ChangePassword.css';

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (!validatePassword(newPassword)) {
      setError('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/users/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccess('Password updated successfully! Please log in again.');
      setTimeout(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Password change error:', err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          navigate('/login');
        }, 2000);
      } else {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.old_password?.[0] ||
          err.response?.data?.new_password?.[0] ||
          'Failed to change password. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <h2>Change Password</h2>
      <form onSubmit={handleSubmit} className="change-password-form">
        <div className="form-group">
          <label>Old Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            minLength="8"
            placeholder="Enter a strong password"
          />
        </div>
        <div className="form-group">
          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            minLength="8"
            placeholder="Confirm your password"
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <button type="submit" disabled={loading} className="change-password-button">
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword; 