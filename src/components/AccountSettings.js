import React, { useState, useEffect } from 'react';

const AccountSettings = ({ user, onUpdateUser, onDeleteAccount, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedUser = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('fetchit_user', JSON.stringify(updatedUser));
      onUpdateUser(updatedUser);
      setSuccess('Profile updated successfully!');
    } catch (error) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Password changed successfully!');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setError('Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear all user data
      localStorage.removeItem('fetchit_user');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('tokens_') || key.startsWith('oauth_state_')) {
          localStorage.removeItem(key);
        }
      });
      
      onDeleteAccount();
    } catch (error) {
      setError('Failed to delete account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="account-settings-page">
      <div className="settings-header">
        <button onClick={onClose} className="back-btn">← Back</button>
        <h2>Account Settings</h2>
        <div></div>
      </div>

        <div className="settings-content">
          <div className="settings-sidebar">
            <div className="settings-nav">
              <button className="nav-item active">
                <span className="nav-icon">👤</span>
                Profile
              </button>
              <button className="nav-item">
                <span className="nav-icon">🔒</span>
                Security
              </button>
              <button className="nav-item">
                <span className="nav-icon">💳</span>
                Plan
              </button>
              <button className="nav-item danger">
                <span className="nav-icon">⚠️</span>
                Account
              </button>
            </div>
          </div>

          <div className="settings-main">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="settings-section">
            <div className="section-header">
              <h3>Profile Information</h3>
              <p>Update your personal information and email address</p>
            </div>
            
            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-label">
                  <span>Name</span>
                  <small>{formData.firstName} {formData.lastName}</small>
                </div>
                <button className="setting-action">Edit</button>
              </div>
              
              <div className="setting-item">
                <div className="setting-label">
                  <span>Email</span>
                  <small>{formData.email}</small>
                </div>
                <button className="setting-action">Edit</button>
              </div>
              
              <div className="setting-item">
                <div className="setting-label">
                  <span>Password</span>
                  <small>••••••••</small>
                </div>
                <button className="setting-action">Change</button>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="section-header">
              <h3>Account Information</h3>
              <p>Your current plan and membership details</p>
            </div>
            
            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-label">
                  <span>Plan</span>
                  <small>{user?.plan || 'Free Plan'}</small>
                </div>
                <button className="setting-action">Upgrade</button>
              </div>
              
              <div className="setting-item">
                <div className="setting-label">
                  <span>Member Since</span>
                  <small>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</small>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section danger-section">
            <div className="section-header">
              <h3>Danger Zone</h3>
              <p>Irreversible actions that will permanently affect your account</p>
            </div>
            
            <div className="settings-list">
              <div className="setting-item danger-item">
                <div className="setting-label">
                  <span>Delete Account</span>
                  <small>Permanently delete your account and all data</small>
                </div>
                {!showDeleteConfirm ? (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="setting-action danger"
                  >
                    Delete
                  </button>
                ) : (
                  <div className="delete-confirm-inline">
                    <button 
                      onClick={handleDeleteAccount}
                      className="setting-action danger small"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Deleting...' : 'Confirm'}
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="setting-action secondary small"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default AccountSettings;
