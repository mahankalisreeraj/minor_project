import './LoginForm.css';
import React, { useState } from 'react';
import ApiService from '../services/api';

const LoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'buyer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data before sending
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      console.log('🔐 Attempting login with:', { 
        email: formData.email, 
        userType: formData.userType,
        password: '***' 
      });
      
      // Create clean data object
      const loginData = {
        email: formData.email.trim(),
        password: formData.password.trim(),
        userType: formData.userType
      };
      
      const response = await ApiService.login(loginData);
      
      if (response.success) {
        console.log('✅ Login successful:', response.user);
        onLogin(response.user);
      } else {
        console.log('❌ Login failed:', response.message);
        setError(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      
      if (error.message.includes('Connection failed')) {
        setError('Connection failed. Please make sure the server is running.');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('JSON')) {
        setError('Data format error. Please try again.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h3>Welcome Back</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="user-type-selector">
          <label>
            <input
              type="radio"
              name="userType"
              value="buyer"
              checked={formData.userType === 'buyer'}
              onChange={handleChange}
            />
            I'm a Buyer
          </label>
          <label>
            <input
              type="radio"
              name="userType"
              value="seller"
              checked={formData.userType === 'seller'}
              onChange={handleChange}
            />
            I'm a Seller
          </label>
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter your password"
          />
        </div>

        <button 
          type="submit" 
          className="auth-button"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <div className="auth-links">
          <a href="#forgot">Forgot Password?</a>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
