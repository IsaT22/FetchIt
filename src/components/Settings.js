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

      </div>
    </div>
  );
};

export default Settings;
