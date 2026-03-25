import './SignupForm.css';
import React, { useState } from 'react';
import ApiService from '../services/api';

const SignupForm = ({ onSignup }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'buyer',
    businessName: '',
    phone: ''
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
      // Validate form data
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword || !formData.phone) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.userType === 'seller' && !formData.businessName) {
        setError('Business name is required for sellers');
        setLoading(false);
        return;
      }

      console.log('📝 Attempting signup with:', { 
        ...formData, 
        password: '***' 
      });
      
      // Create clean data object
      const signupData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        userType: formData.userType,
        businessName: formData.businessName.trim(),
        phone: formData.phone.trim()
      };
      
      const response = await ApiService.signup(signupData);
      
      if (response.success) {
        console.log('✅ Signup successful:', response.user);
        onSignup(response.user);
      } else {
        console.log('❌ Signup failed:', response.message);
        setError(response.message || 'Signup failed');
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      
      if (error.message.includes('Connection failed')) {
        setError('Connection failed. Please make sure the server is running.');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('JSON')) {
        setError('Data format error. Please try again.');
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h3>Create Your Account</h3>
      
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

        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter first name"
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter last name"
            />
          </div>
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

        <div className="form-row">
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Create a password"
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Confirm your password"
            />
          </div>
        </div>

        {formData.userType === 'seller' && (
          <div className="form-group">
            <label>Business Name</label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter business name"
            />
          </div>
        )}

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter phone number"
          />
        </div>

        <button 
          type="submit" 
          className="auth-button"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};

export default SignupForm;
