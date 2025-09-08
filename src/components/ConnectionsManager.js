import React, { useState, useEffect } from 'react';
import PlatformBrowser from './PlatformBrowser';
import PlatformSetup from './PlatformSetup';

const ConnectionsManager = ({ connections, onConnect, onDisconnect, onViewChange }) => {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'browse', 'manage', 'setup'
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  // Check URL parameters for view and platform
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const view = urlParams.get('view');
    const platformId = urlParams.get('platform');
    
    if (view === 'browse') {
      setCurrentView('browse');
    } else if (view === 'manage') {
      setCurrentView('manage');
    } else if (platformId) {
      // Import platform registry to get full platform object
      import('../services/platformRegistry').then(({ platformRegistry }) => {
        const platform = platformRegistry[platformId];
        if (platform) {
          setSelectedPlatform(platform);
          setCurrentView('setup');
        }
      });
    }
  }, []);

  const getConnectionIcon = (connectionId) => {
    const icons = {
      googleDrive: '📁',
      oneDrive: '☁️',
      dropbox: '📦',
      notion: '📝',
      gmail: '📧'
    };
    return icons[connectionId] || '🔗';
  };

  const handleSelectPlatform = (platform) => {
    setSelectedPlatform(platform);
    setCurrentView('setup');
    
    // Update URL
    window.location.hash = `#connections?platform=${platform.id}`;
  };

  // const handleSetupComplete = () => {
  //   setCurrentView('main');
  //   setSelectedPlatform(null);
  // };

  const handleBackToMain = () => {
    onViewChange('chat');
  };

  // Platform Browser View
  if (currentView === 'browse') {
    return (
      <PlatformBrowser 
        onSelectPlatform={handleSelectPlatform}
        onBack={handleBackToMain}
      />
    );
  }

  // Platform Setup View
  if (currentView === 'setup' && selectedPlatform) {
    return (
      <PlatformSetup 
        platform={selectedPlatform}
        onConnect={onConnect}
        onBack={handleBackToMain}
        onViewChange={onViewChange}
        connections={connections}
      />
    );
  }

  // Manage Connections View
  if (currentView === 'manage') {
    const connectedPlatforms = Object.entries(connections).filter(([_, connection]) => connection.connected);
    
    return (
      <div className="connections-manager manage-view">
        <div className="manager-header">
          <button className="back-btn" onClick={handleBackToMain}>
            ← Back
          </button>
          <h2>Manage Connections</h2>
          <p>Control your connected platforms</p>
        </div>

        <div className="connected-platforms-list">
          {connectedPlatforms.length > 0 ? (
            connectedPlatforms.map(([connectionId, connection]) => (
              <div key={connectionId} className="connected-platform-item">
                <div className="platform-info">
                  <span className="platform-icon">{getConnectionIcon(connectionId)}</span>
                  <div className="platform-details">
                    <h4>{connection.name}</h4>
                    <p className="connection-status">
                      {connection.enabled ? 'Active' : 'Connected but inactive'}
                    </p>
                  </div>
                </div>
                <div className="platform-controls">
                  <label className="toggle-switch">
                    <span className="toggle-label">Active</span>
                    <input
                      type="checkbox"
                      checked={connection.enabled}
                      onChange={() => onConnect(connectionId, { toggle: true })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <button 
                    className="disconnect-btn"
                    onClick={() => onDisconnect(connectionId)}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-connections-message">
              <p>No connected platforms yet</p>
              <button 
                className="browse-platforms-btn"
                onClick={() => setCurrentView('browse')}
              >
                Browse Platforms
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

};

export default ConnectionsManager;
