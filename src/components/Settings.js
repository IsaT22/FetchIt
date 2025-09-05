import React, { useState, useEffect } from 'react';

const Settings = ({ user, onClose, onUpdateUser, onDeleteAccount, onSignOut, onNavigate }) => {
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
  const [isEditing, setIsEditing] = useState(false);

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
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const updatedUser = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      };

      localStorage.setItem('fetchit_user', JSON.stringify(updatedUser));
      onUpdateUser(updatedUser);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate password change
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
    setError('');

    try {
      localStorage.removeItem('fetchit_user');
      localStorage.clear();
      
      onDeleteAccount();
    } catch (error) {
      setError('Failed to delete account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button onClick={onClose} className="back-btn">← Back</button>
        <h2>Settings</h2>
        <div></div>
      </div>

      <div className="settings-content-scrollable">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Profile Section */}
        <div className="settings-section">
          <div className="section-header">
            <h3>Profile Information</h3>
            <p>Update your personal information and email address</p>
          </div>
          
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-label">
                <span>Name</span>
                <small>{user?.firstName} {user?.lastName}</small>
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className="setting-action"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            {isEditing && (
              <>
                <div className="setting-item">
                  <div className="setting-input">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="setting-item">
                  <div className="setting-input">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="setting-item">
                  <div className="setting-input">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="setting-item">
                  <div className="setting-label"></div>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="setting-action"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            <div className="setting-item">
              <div className="setting-label">
                <span>Password</span>
                <small>••••••••</small>
              </div>
              <button className="setting-action">Change</button>
            </div>
          </div>
        </div>

        {/* Account Information Section */}
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
              <button className="setting-action secondary">Upgrade</button>
            </div>
            <div className="setting-item">
              <div className="setting-label">
                <span>Member Since</span>
                <small>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</small>
              </div>
            </div>
          </div>
        </div>

        {/* App Settings Section */}
        <div className="settings-section">
          <div className="section-header">
            <h3>App Settings</h3>
            <p>Customize your FetchIt experience</p>
          </div>
          
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-label">
                <span>Platform Connections</span>
                <small>Manage your connected platforms and file access</small>
              </div>
              <button 
                onClick={() => onNavigate('connections')} 
                className="setting-action"
              >
                Manage
              </button>
            </div>
            <div className="setting-item">
              <div className="setting-label">
                <span>File Management</span>
                <small>Access and organize files from all platforms</small>
              </div>
              <button 
                onClick={() => onNavigate('files')} 
                className="setting-action"
              >
                Browse Files
              </button>
            </div>
          </div>
        </div>

        {/* Privacy & Security Section */}
        <div className="settings-section">
          <div className="section-header">
            <h3>Privacy & Security</h3>
            <p>Your data protection and security settings</p>
          </div>
          
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-label">
                <span>Data Encryption</span>
                <small>All data encrypted with AES-256</small>
              </div>
              <span className="status-badge active">Active</span>
            </div>
            <div className="setting-item">
              <div className="setting-label">
                <span>Local Storage</span>
                <small>Data stored locally on your device</small>
              </div>
              <span className="status-badge active">Enabled</span>
            </div>
          </div>
        </div>

        {/* Account Actions Section */}
        <div className="settings-section">
          <div className="section-header">
            <h3>Account Actions</h3>
            <p>Sign out or manage your account</p>
          </div>
          
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-label">
                <span>Sign Out</span>
                <small>Sign out of your FetchIt account</small>
              </div>
              <button onClick={onSignOut} className="setting-action secondary">Sign Out</button>
            </div>
          </div>
        </div>

        {/* Danger Zone Section */}
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
                    disabled={isLoading}
                    className="setting-action danger small"
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
  );
};

export default Settings;
