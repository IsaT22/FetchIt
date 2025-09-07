import React, { useState } from 'react';
import oauthService from '../services/oauthService';

const PlatformSetup = ({ platform, onConnect, onBack, connections, onViewChange }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  
  if (!platform) return null;
  
  // Check if platform is already connected
  const isConnected = connections && connections[platform.id] && connections[platform.id].connected;

  const handleConnect = async () => {
    if (isConnected) {
      // Handle disconnect
      if (window.confirm(`Are you sure you want to disconnect from ${platform.name}?`)) {
        try {
          // Remove tokens and connection data
          localStorage.removeItem(`tokens_${platform.id}`);
          localStorage.removeItem(`connection_${platform.id}`);
          
          // Notify parent component
          if (onConnect) {
            onConnect(platform.id, { connected: false, enabled: false });
          }
          
          alert(`Successfully disconnected from ${platform.name}!`);
          onBack();
        } catch (error) {
          console.error('Disconnect failed:', error);
          alert(`Failed to disconnect from ${platform.name}: ${error.message}`);
        }
      }
      return;
    }

    setIsConnecting(true);
    try {
      const result = await oauthService.initiateOAuth(platform.id);
      console.log('OAuth result:', result);
      
      // Handle OAuth success - check for either code (needs exchange) or direct tokens
      if (result && result.code) {
        console.log('Exchanging code for token...');
        // Exchange code for token
        const tokens = await oauthService.exchangeCodeForToken(platform.id, result.code, result.state);
        console.log('Token exchange successful:', tokens);
        
        // Notify parent component of successful connection
        if (onConnect) {
          onConnect(platform.id, { tokens, connected: true });
        }
        
        alert(`Successfully connected to ${platform.name}!`);
        
        // Navigate back to connections
        setTimeout(() => {
          onBack();
        }, 1000);
      } else if (result && result.access_token) {
        console.log('Direct token received (already exchanged):', result);
        
        // Notify parent component of successful connection
        if (onConnect) {
          onConnect(platform.id, { tokens: result, connected: true });
        }
        
        alert(`Successfully connected to ${platform.name}!`);
        
        // Navigate back to connections
        setTimeout(() => {
          onBack();
        }, 1000);
      } else {
        console.log('No code or token received from OAuth:', result);
      }
    } catch (error) {
      console.error('OAuth failed:', error);
      alert(`Failed to connect to ${platform.name}: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const getPlatformLogo = (platformId) => {
    const logos = {
      googleDrive: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/googledrive.svg',
      oneDrive: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/microsoftonedrive.svg',
      dropbox: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/dropbox.svg',
      github: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg',
      slack: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/slack.svg',
      gmail: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/gmail.svg',
      figma: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/figma.svg',
      trello: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/trello.svg',
      notion: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/notion.svg'
    };
    return logos[platformId] || 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/cloud.svg';
  };

  const getPermissions = (platformId) => {
    const permissions = {
      googleDrive: {
        'File Access': ['Read your Google Drive files', 'Access file metadata', 'Download files for search indexing'],
        'Search & Organization': ['Search through your files', 'Access folder structure', 'Read file sharing permissions']
      },
      oneDrive: {
        'File Access': ['Read your OneDrive files', 'Access file metadata', 'Download files for search indexing'],
        'Office Integration': ['Access Office documents', 'Read document content', 'Access sharing settings']
      },
      dropbox: {
        'File Access': ['Read your Dropbox files', 'Access file metadata', 'Download files for search indexing'],
        'Version Control': ['Access file versions', 'Read revision history', 'Access sharing links']
      },
      github: {
        'Repository Access': ['Read your repositories', 'Access code files', 'Read commit history'],
        'Collaboration': ['Access issues and pull requests', 'Read project documentation', 'Access repository metadata']
      },
      slack: {
        'Message Access': ['Read your messages', 'Access channel content', 'Search message history'],
        'File Sharing': ['Access shared files', 'Read file attachments', 'Access workspace information']
      },
      gmail: {
        'Email Access': ['Read your emails', 'Access email metadata', 'Search email content'],
        'Organization': ['Access labels and folders', 'Read email threads', 'Access contact information']
      },
      figma: {
        'Design Access': ['Read your Figma files', 'Access design components', 'Read project information'],
        'Collaboration': ['Access comments and feedback', 'Read team information', 'Access version history']
      },
      trello: {
        'Board Access': ['Read your Trello boards', 'Access card information', 'Read list contents'],
        'Project Management': ['Access due dates and assignments', 'Read comments and activities', 'Access team information']
      },
      notion: {
        'Page Access': ['Read your Notion pages', 'Access database content', 'Read page properties'],
        'Database': ['Access database records', 'Read page relationships', 'Access workspace information']
      }
    };
    return permissions[platformId] || {
      'File Access': ['Read your files', 'Access file metadata', 'Download files for search indexing']
    };
  };

  const permissions = getPermissions(platform.id);

  return (
    <div className="auth-setup-container">
      <div className="auth-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <div className="platform-info">
          <img src={getPlatformLogo(platform.id)} alt={platform.name} className="platform-icon-large" />
          <div>
            <h2>Connect {platform.name}</h2>
            <p>{platform.description}</p>
          </div>
        </div>
      </div>

      <div className="auth-content">
        <div className="permissions-section">
          <h3>What FetchIt will access</h3>
          {Object.entries(permissions).map(([category, items]) => (
            <div key={category} className="permission-group">
              <h4>{category}</h4>
              <ul className="permissions-list">
                {items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
          
          <div className="privacy-info">
            <div className="privacy-item">
              <h4>🔒 Data Security</h4>
              <p>All data is encrypted using AES-256 encryption and stored securely on your device.</p>
            </div>
            <div className="privacy-item">
              <h4>🚫 No Data Sharing</h4>
              <p>Your personal data is never shared with third parties or used for advertising.</p>
            </div>
            <div className="privacy-item">
              <h4>🗑️ Easy Removal</h4>
              <p>You can disconnect and remove all data at any time from your account settings.</p>
            </div>
          </div>
        </div>

        <div className="auth-form-section">
          <h3>Authentication</h3>
          <div className="oauth-section">
            <div className="oauth-info">
              <h4>OAuth 2.0 Authentication</h4>
              <p>You'll be redirected to {platform.name} to securely authorize FetchIt. We never see your password.</p>
            </div>
            
            <div className="form-actions">
              <button 
                className={`connect-btn ${isConnected ? 'disconnect' : 'primary'}`}
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (isConnected ? 'Disconnecting...' : 'Connecting...') : 
                 (isConnected ? `Disconnect ${platform.name}` : `Connect ${platform.name}`)}
              </button>
            </div>
          </div>

          <div className="security-notice">
            <h4>🛡️ Security Notice</h4>
            <p>FetchIt uses industry-standard security practices including OAuth 2.0, AES-256 encryption, and secure token storage. Your authentication tokens are encrypted and stored locally on your device.</p>
          </div>
        </div>
      </div>

      <div className="help-section">
        <p className="terms-text">
          By connecting, you agree to our <a href="/terms" className="link" onClick={(e) => { e.preventDefault(); onViewChange('terms'); }}>Terms of Service</a> and <a href="/privacy" className="link" onClick={(e) => { e.preventDefault(); onViewChange('privacy'); }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default PlatformSetup;
