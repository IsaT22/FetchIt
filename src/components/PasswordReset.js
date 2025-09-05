import React, { useState } from 'react';

const PasswordReset = ({ onClose, onBackToAuth }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      // Simulate API call for password reset
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if user exists
      const existingUser = localStorage.getItem('fetchit_user');
      if (existingUser) {
        const userData = JSON.parse(existingUser);
        if (userData.email === email) {
          setSuccess(true);
        } else {
          setError('No account found with this email address');
        }
      } else {
        setError('No account found with this email address');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-title-section">
              <h1 className="auth-title">Check your email</h1>
            </div>
          </div>

          <div className="auth-form">
            <div className="reset-success">
              <div className="success-icon">📧</div>
              <p>We've sent a password reset link to <strong>{email}</strong></p>
              <p>Click the link in the email to reset your password.</p>
            </div>

            <div className="auth-footer">
              <p className="switch-mode">
                Remember your password?
                <button 
                  type="button" 
                  onClick={onBackToAuth}
                  className="auth-switch-btn"
                >
                  Back to Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-title-section">
            <h1 className="auth-title">Reset your password</h1>
          </div>
        </div>

        <div className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="auth-footer">
            <p className="switch-mode">
              Remember your password?
              <button 
                type="button" 
                onClick={onBackToAuth}
                className="auth-switch-btn"
              >
                Back to Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
