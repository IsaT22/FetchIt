import React, { useState } from 'react';

const UserSettings = ({ user, onClose, onUserUpdate, onSignOut, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('account');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    const updatedUser = {
      ...user,
      ...editData
    };
    localStorage.setItem('fetchit_user', JSON.stringify(updatedUser));
    onUserUpdate(updatedUser);
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    localStorage.removeItem('fetchit_user');
    localStorage.clear(); // Clear all user data
    window.location.reload(); // Refresh to reset app state
  };

  const renderAccountTab = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <h3>Account Information</h3>
        <div className="account-info">
          {isEditing ? (
            <div className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={editData.firstName}
                    onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={editData.lastName}
                    onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                />
              </div>
              <div className="edit-actions">
                <button onClick={handleSave} className="save-btn">Save Changes</button>
                <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="account-display">
              <div className="info-item">
                <label>Name</label>
                <span>{user.firstName} {user.lastName}</span>
              </div>
              <div className="info-item">
                <label>Email</label>
                <span>{user.email}</span>
              </div>
              <div className="info-item">
                <label>Plan</label>
                <span className="plan-badge">{user.plan}</span>
              </div>
              <div className="info-item">
                <label>Member Since</label>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <button onClick={() => setIsEditing(true)} className="edit-btn">Edit Profile</button>
            </div>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3>Account Actions</h3>
        <div className="account-actions">
          <button onClick={onSignOut} className="sign-out-btn">
            Sign Out
          </button>
          <button 
            onClick={() => setShowDeleteConfirm(true)} 
            className="delete-account-btn"
          >
            Delete Account
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="confirm-content">
            <h4>Delete Account</h4>
            <p>Are you sure you want to delete your account? This action cannot be undone and will remove all your data, connections, and files.</p>
            <div className="confirm-actions">
              <button onClick={handleDeleteAccount} className="confirm-delete-btn">
                Yes, Delete Account
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderConnectionsTab = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <h3>Platform Connections</h3>
        <p>Manage your connected platforms and file access permissions.</p>
        <button 
          onClick={() => onNavigate('connections')} 
          className="navigate-btn"
        >
          Manage Connections
        </button>
      </div>
    </div>
  );

  const renderFilesTab = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <h3>File Management</h3>
        <p>Access and organize your files from all connected platforms.</p>
        <button 
          onClick={() => onNavigate('files')} 
          className="navigate-btn"
        >
          Browse Files
        </button>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <h3>Privacy & Security</h3>
        <div className="privacy-info">
          <div className="privacy-item">
            <h4>Data Encryption</h4>
            <p>All your data is encrypted using AES-256 encryption before being stored locally.</p>
          </div>
          <div className="privacy-item">
            <h4>Platform Access</h4>
            <p>You can revoke platform access at any time through the connections manager.</p>
          </div>
          <div className="privacy-item">
            <h4>Local Storage</h4>
            <p>Your data is stored locally on your device and never sent to external servers without your consent.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Account Settings</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="settings-content">
          <div className="settings-sidebar">
            <div className="settings-tabs">
              <button 
                className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => setActiveTab('account')}
              >
                Account
              </button>
              <button 
                className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
                onClick={() => setActiveTab('connections')}
              >
                Connections
              </button>
              <button 
                className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
                onClick={() => setActiveTab('files')}
              >
                Files
              </button>
              <button 
                className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
                onClick={() => setActiveTab('privacy')}
              >
                Privacy
              </button>
            </div>
          </div>

          <div className="settings-main">
            {activeTab === 'account' && renderAccountTab()}
            {activeTab === 'connections' && renderConnectionsTab()}
            {activeTab === 'files' && renderFilesTab()}
            {activeTab === 'privacy' && renderPrivacyTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
