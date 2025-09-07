import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = ({ onBack }) => {
  return (
    <div className="privacy-container">
      <div className="privacy-header">
        <button onClick={onBack} className="back-button">
          ← Back
        </button>
        <h1>Privacy Policy</h1>
      </div>
      
      <div className="privacy-content">
        <div className="privacy-section">
          <h2>1. Information We Collect</h2>
          <p>
            FetchIt AI Assistant operates with a privacy-first approach. We collect minimal information necessary to provide our service:
          </p>
          <ul>
            <li>OAuth tokens for connected platforms (stored encrypted in your browser)</li>
            <li>Usage analytics to improve the service (anonymized)</li>
            <li>Error logs for debugging purposes (no personal data included)</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>2. How We Use Your Information</h2>
          <p>
            Your information is used solely to provide and improve FetchIt's services:
          </p>
          <ul>
            <li>Accessing your connected cloud storage platforms</li>
            <li>Analyzing file content to provide AI-powered search results</li>
            <li>Maintaining secure connections to third-party services</li>
            <li>Improving our AI models and user experience</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>3. Data Storage and Security</h2>
          <p>
            We prioritize your data security and privacy:
          </p>
          <ul>
            <li><strong>Local Storage:</strong> OAuth tokens are encrypted with AES-256 and stored in your browser</li>
            <li><strong>No File Storage:</strong> We do not store copies of your files on our servers</li>
            <li><strong>Secure Processing:</strong> File analysis is performed in real-time without retention</li>
            <li><strong>Data Isolation:</strong> Each user's data is completely isolated from others</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>4. Third-Party Services</h2>
          <p>
            FetchIt integrates with various cloud storage providers and AI services:
          </p>
          <ul>
            <li><strong>Cloud Storage:</strong> Google Drive, OneDrive, Dropbox (subject to their privacy policies)</li>
            <li><strong>AI Services:</strong> OpenAI, Cohere for content analysis</li>
            <li><strong>Vector Database:</strong> Chroma for semantic search capabilities</li>
          </ul>
          <p>
            We recommend reviewing the privacy policies of these third-party services.
          </p>
        </div>

        <div className="privacy-section">
          <h2>5. Data Sharing</h2>
          <p>
            We do not sell, trade, or share your personal information with third parties, except:
          </p>
          <ul>
            <li>When required by law or legal process</li>
            <li>To protect our rights, property, or safety</li>
            <li>With your explicit consent</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>6. Your Rights</h2>
          <p>
            You have full control over your data:
          </p>
          <ul>
            <li><strong>Access:</strong> View what data we have about you</li>
            <li><strong>Deletion:</strong> Disconnect platforms to remove stored tokens</li>
            <li><strong>Portability:</strong> Export your connection settings</li>
            <li><strong>Control:</strong> Manage which platforms you connect</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>7. Cookies and Tracking</h2>
          <p>
            FetchIt uses minimal tracking:
          </p>
          <ul>
            <li>Essential cookies for app functionality</li>
            <li>Local storage for user preferences and OAuth tokens</li>
            <li>No third-party tracking or advertising cookies</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>8. Children's Privacy</h2>
          <p>
            FetchIt is not intended for children under 13. We do not knowingly collect personal information from children under 13.
          </p>
        </div>

        <div className="privacy-section">
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify users of any material changes through the app interface.
          </p>
        </div>

        <div className="privacy-section">
          <h2>10. Contact Us</h2>
          <p>
            If you have questions about this privacy policy or your data, please contact us through the app's feedback system.
          </p>
        </div>

        <div className="privacy-footer">
          <p><strong>Last updated:</strong> January 2025</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
