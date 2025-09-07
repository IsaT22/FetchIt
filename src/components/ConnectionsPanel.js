import React, { useState, useEffect, useRef } from 'react';

const ConnectionsPanel = ({ connections, toggleConnection, connectPlatform, onViewChange }) => {
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowPanel(false);
      }
    };

    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPanel]);

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

  const getConnectionStatus = (connection) => {
    if (!connection.connected) return 'disconnected';
    if (connection.enabled) return 'enabled';
    return 'connected';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'enabled': return '#10b981';
      case 'connected': return '#6b7280';
      case 'disconnected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // const connectedCount = Object.values(connections).filter(conn => conn.connected).length;
  // const enabledCount = Object.values(connections).filter(conn => conn.enabled).length;

  const connectedPlatforms = Object.entries(connections).filter(([_, connection]) => connection.connected);
  const hasConnections = connectedPlatforms.length > 0;

  return (
    <div className="connections-panel" ref={panelRef}>
      <button 
        className="nav-button"
        onClick={() => setShowPanel(!showPanel)}
        title="Connections"
      >
        🔗 Connections
      </button>

      {showPanel && (
        <div className="connections-dropdown">
          <div className="dropdown-header">
            <h3>Connections</h3>
            <p>Manage your platform connections</p>
          </div>
          
          {hasConnections ? (
            <>
              <div className="connections-list">
                {connectedPlatforms.map(([connectionId, connection]) => {
                  const status = getConnectionStatus(connection);
                  
                  return (
                    <div key={connectionId} className="connection-item">
                      <div className="connection-info">
                        <span className="connection-icon">
                          {getConnectionIcon(connectionId)}
                        </span>
                        <div className="connection-details">
                          <span className="connection-name">{connection.name}</span>
                          <span 
                            className={`connection-status`}
                            style={{ color: getStatusColor(status) }}
                          >
                            {status === 'enabled' ? 'Active' : 'Connected'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="connection-controls">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={connection.enabled}
                            onChange={() => toggleConnection(connectionId)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="dropdown-footer">
                <button 
                  className="add-connection-btn"
                  onClick={() => {
                    setShowPanel(false);
                    onViewChange('connections');
                    window.location.hash = '#connections?view=browse';
                  }}
                >
                  + Add Connection
                </button>
                <button 
                  className="manage-connections-btn"
                  onClick={() => {
                    setShowPanel(false);
                    onViewChange('connections');
                    window.location.hash = '#connections?view=manage';
                  }}
                >
                  Manage Connections
                </button>
              </div>
            </>
          ) : (
            <div className="no-connections">
              <p>No connections yet</p>
              <div className="connection-actions">
                <button 
                  className="add-connection-btn primary"
                  onClick={() => {
                    setShowPanel(false);
                    onViewChange('connections');
                    window.location.hash = '#connections?view=browse';
                  }}
                >
                  + Add Connection
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionsPanel;
