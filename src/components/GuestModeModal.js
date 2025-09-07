// Guest Mode Modal - Allows users to continue without persistent storage
import React from 'react';

const GuestModeModal = ({ isOpen, onClose, onContinueAsGuest, onSignUp }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content guest-mode-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Welcome to FetchIt AI</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="mode-options">
            <div className="mode-option recommended">
              <div className="mode-icon">👤</div>
              <h3>Create Account</h3>
              <p>Save your connections, chat history, and preferences</p>
              <ul className="feature-list">
                <li>✓ Persistent OAuth connections</li>
                <li>✓ Chat history saved</li>
                <li>✓ Learning from your feedback</li>
                <li>✓ Custom settings</li>
              </ul>
              <button className="mode-btn primary" onClick={onSignUp}>
                Create Account
              </button>
            </div>
            
            <div className="mode-option">
              <div className="mode-icon">🚀</div>
              <h3>Continue as Guest</h3>
              <p>Full functionality without saving data</p>
              <ul className="feature-list">
                <li>✓ All AI search features</li>
                <li>✓ OAuth setup (session only)</li>
                <li>✓ File analysis & chat</li>
                <li>⚠️ No data persistence</li>
              </ul>
              <button className="mode-btn secondary" onClick={onContinueAsGuest}>
                Continue as Guest
              </button>
            </div>
          </div>
          
          <div className="guest-mode-info">
            <h4>Guest Mode Details:</h4>
            <ul>
              <li>You can still connect Google Drive, Dropbox, etc. during your session</li>
              <li>All connections and chat history will be cleared when you close the app</li>
              <li>You'll need to reconnect your accounts each time you visit</li>
              <li>Perfect for trying out FetchIt or using on shared devices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestModeModal;
