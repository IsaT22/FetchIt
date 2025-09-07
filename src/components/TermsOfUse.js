import React from 'react';
import './TermsOfUse.css';

const TermsOfUse = ({ onBack }) => {
  return (
    <div className="terms-container">
      <div className="terms-header">
        <button onClick={onBack} className="back-button">
          ← Back
        </button>
        <h1>Terms of Use</h1>
      </div>
      
      <div className="terms-content">
        <div className="terms-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using FetchIt AI Assistant ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </div>

        <div className="terms-section">
          <h2>2. Description of Service</h2>
          <p>
            FetchIt is an AI-powered assistant that helps you search and analyze files from your connected cloud storage platforms including Google Drive, OneDrive, Dropbox, and others.
          </p>
        </div>

        <div className="terms-section">
          <h2>3. User Accounts and Data</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. FetchIt stores OAuth tokens securely and encrypted in your browser's local storage. We do not store your personal files or data on our servers.
          </p>
        </div>

        <div className="terms-section">
          <h2>4. Privacy and Data Security</h2>
          <p>
            Your privacy is important to us. All file content analysis is performed using secure AI services, and we do not retain copies of your files or personal data. OAuth tokens are encrypted using AES-256 encryption.
          </p>
        </div>

        <div className="terms-section">
          <h2>5. Third-Party Services</h2>
          <p>
            FetchIt integrates with third-party services (Google Drive, OneDrive, etc.). Your use of these services is subject to their respective terms of service and privacy policies.
          </p>
        </div>

        <div className="terms-section">
          <h2>6. Prohibited Uses</h2>
          <p>
            You may not use FetchIt for any unlawful purpose or to violate any laws. You agree not to attempt to gain unauthorized access to any part of the Service.
          </p>
        </div>

        <div className="terms-section">
          <h2>7. Limitation of Liability</h2>
          <p>
            FetchIt is provided "as is" without any warranties. We shall not be liable for any damages arising from the use of this service.
          </p>
        </div>

        <div className="terms-section">
          <h2>8. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of any changes.
          </p>
        </div>

        <div className="terms-section">
          <h2>9. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Use, please contact us through the app's feedback system.
          </p>
        </div>

        <div className="terms-footer">
          <p><strong>Last updated:</strong> January 2025</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
