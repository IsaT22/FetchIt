import React, { useState } from 'react';
import PasswordReset from './PasswordReset';
import userStorageService from '../services/userStorageService';

const UserAuth = ({ onClose, onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }

    if (isSignUp) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('First and last name are required');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      // Initialize user storage service
      await userStorageService.initialize();

      if (isSignUp) {
        // Create account with encrypted storage
        try {
          const userData = await userStorageService.createUser({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName
          });

          console.log('Account created successfully:', userData.email);
          onAuthSuccess(userData);
        } catch (createError) {
          if (createError.message.includes('already exists')) {
            setError('An account with this email already exists. Please sign in instead.');
          } else {
            setError('Failed to create account. Please try again.');
          }
          return;
        }
      } else {
        // Sign in with encrypted storage
        try {
          const userData = await userStorageService.authenticateUser(formData.email, formData.password);
          console.log('User authenticated successfully:', userData.email);
          onAuthSuccess(userData);
        } catch (authError) {
          setError(authError.message);
          return;
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showPasswordReset) {
    return (
      <PasswordReset 
        onClose={onClose}
        onBackToAuth={() => setShowPasswordReset(false)}
      />
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-title-section">
            <h1 className="auth-title">
              {isSignUp ? 'Create your FetchIt account' : 'Sign in to FetchIt'}
            </h1>
          </div>
        </div>

        <div className="auth-form">

          <form onSubmit={handleSubmit}>
            {isSignUp ? (
              <>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </>
            )}

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {!isSignUp && (
            <div className="forgot-password">
              <button 
                type="button" 
                onClick={() => setShowPasswordReset(true)}
                className="forgot-password-btn"
              >
                Forgot your password?
              </button>
            </div>
          )}

        </div>

        <div className="auth-footer">
          <p className="switch-mode">
            {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}
            <button 
              type="button" 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setFormData({
                  email: '',
                  password: '',
                  confirmPassword: '',
                  firstName: '',
                  lastName: '',
                  username: ''
                });
              }}
              className="auth-switch-btn"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default UserAuth;
